#!/usr/bin/env escript
%% -*- erlang -*-
%%! -smp enable -sname generate_appup verbose

start(AppName, OldVsn) ->
    %% -------------------------update version number - start-------------------------
    NewVsn = increase_vsn(OldVsn, 3, 1),
    update_version(AppName, NewVsn),
    %% -------------------------update version number - end---------------------------

    %% -------------------------generate appup - start-------------------------
    BeamFolder = os:cmd("rebar3 path --app " ++ AppName),
    ModifiedFiles = string:tokens(os:cmd("git ls-files -m | grep -E 'src.*\.erl'"), "\n"),
    ModifiedInstructions = generate_modified_instruction(modified, ModifiedFiles, OldVsn, NewVsn, BeamFolder, []),

    DeletedFiles = string:tokens(os:cmd("git diff --cached --name-only --diff-filter=D | grep -E 'src.*\.erl'"), "\n"),
    DeleteModifiedInstructions = generate_added_deleted_instruction(delete_module, DeletedFiles, ModifiedInstructions),

    AddedFiles = string:tokens(os:cmd("git diff --cached --name-only --diff-filter=A | grep -E 'src.*\.erl'"), "\n"),
    AddedDeleteModifiedInstructions = generate_added_deleted_instruction(add_module, AddedFiles, DeleteModifiedInstructions),
    %% -------------------------generate appup - end---------------------------

    case AddedDeleteModifiedInstructions of
        [] ->
            update_version(AppName, OldVsn),
            io:format("no_change");
        _ ->
            AppupContent = {NewVsn,
                    [{OldVsn, AddedDeleteModifiedInstructions}],
                    [{OldVsn, []}]},
            os:cmd("mkdir -p ebin"),
            AppupContentBin = io_lib:format("~tp.", [AppupContent]),
            file:write_file("ebin/" ++ AppName ++ ".appup", AppupContentBin),
            file:write_file("config/" ++ AppName ++ ".appup", AppupContentBin),
            io:format("~tp", [NewVsn])
    end.

generate_added_deleted_instruction(_, [], InstructionList) ->
    InstructionList;
generate_added_deleted_instruction(Status, [SrcFilePath | Tail], AccInstructions) when add_module == Status orelse delete_module == Status ->
    ModNameStr = filename:rootname(filename:basename(SrcFilePath)),
    ModName = list_to_atom(ModNameStr),
    Instruction = {Status, ModName},
    generate_added_deleted_instruction(Status, Tail, [Instruction | AccInstructions]).

generate_modified_instruction(_, [], _, _, _, InstructionList) ->
    InstructionList;
generate_modified_instruction(modified, [SrcFilePath | Tail], OldVsn, NewVsn, BeamFolder, AccInstructions) ->
    ModNameStr = filename:rootname(filename:basename(SrcFilePath)),
    ModName = list_to_atom(ModNameStr),
    ModFileName = ModNameStr ++ ".beam",
    BeamFilePath = filename:join(BeamFolder, ModFileName),
    Instruction =
        case file:read_file(BeamFilePath) of
            {ok, Beam} ->
                {ok, {_, [{exports, Exports}, {attributes, Attributes}]}} = beam_lib:chunks(Beam, [exports, attributes]),
                Behaviour = proplists:get_value(behaviour, Attributes, []),
                case lists:member(supervisor, Behaviour) of
                    true ->
                        {update, ModName, supervisor};
                    _ ->
                        case lists:member({code_change, 3}, Exports) orelse lists:member({code_change, 4}, Exports) of
                            true ->
                                {update, ModName, {advanced, {OldVsn, NewVsn, []}}};
                            _ ->
                                {load_module, ModName}
                        end
                end;
            _ ->
                io:format("Could not read ~s\n", [BeamFilePath]),
                throw(fail_read_beam)
        end,
    generate_modified_instruction(modified, Tail, OldVsn, NewVsn, BeamFolder, [Instruction | AccInstructions]).

update_version(AppName, TargetVsn) ->
    RelVsnMarker = "release-version-marker",
    os:cmd("sed -i.bak 's/\".*\" %% " ++ RelVsnMarker ++ "/\"" ++ TargetVsn ++ "\" %% " ++ RelVsnMarker ++ "/1' src/" ++ AppName ++ ".app.src  ;\
        sed -i.bak 's/\".*\" %% " ++ RelVsnMarker ++ "/\"" ++ TargetVsn ++ "\" %% " ++ RelVsnMarker ++ "/1' rebar.config  ;\
        rm -f rebar.config.bak  ;\
        rm -f src/" ++ AppName ++ ".app.src.bak").

%% noinspection ErlangUnusedFunction
main([AppName, OldVsn]) ->
    try
        start(AppName, OldVsn)
    catch
%%         fail_read_beam:Reason ->
%%             io:format("~p~n", [Reason]);
        _:Reason ->
            io:format("~p~n", [Reason]),
            usage()
    end;
main(_) ->
    usage().

usage() ->
    io:format("usage: [release-name] [version(x.x.x)]\n"),
    halt(1).

increase_vsn(SourceVersion, VersionDepth, Increment) ->
    string:join(increase_vsn(string:tokens(SourceVersion, "."), VersionDepth, Increment, 1, []), ".").
increase_vsn([], _, _, _, AccVersion) ->
    lists:reverse(AccVersion);
increase_vsn([CurDepthVersionNumStr | Tail], VersionDepth, Increment, CurDepth, AccVersion) ->
    UpdatedVersionNum =
        case CurDepth =:= VersionDepth of
            true ->
                integer_to_list(list_to_integer(CurDepthVersionNumStr) + Increment);
            _ ->
                CurDepthVersionNumStr
        end,
    increase_vsn(Tail, VersionDepth, Increment, CurDepth + 1, [UpdatedVersionNum | AccVersion]).

%% generate_appups(Map, State) when is_map(Map) ->
%%     maps:map(fun(K,V) ->
%%         create_appup_term(generate_appup(K,V,State))
%%     end, Map).