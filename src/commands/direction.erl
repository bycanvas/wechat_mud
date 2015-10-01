%%%-------------------------------------------------------------------
%%% @author shuieryin
%%% @copyright (C) 2015, Shuieryin
%%% @doc
%%%
%%% Generic direction module
%%%
%%% @end
%%% Created : 20. Sep 2015 4:08 PM
%%%-------------------------------------------------------------------
-module(direction).
-author("shuieryin").

%% API
-export([exec/3,
    parse_direction/1]).

-type directions() :: east | south | west | north | northeast | southeast | southwest | northwest.
-export_type([directions/0]).

%%%===================================================================
%%% API
%%%===================================================================

%%--------------------------------------------------------------------
%% @doc
%% Execute user input direction, the "Direction" parameter has been
%% validated ahead in "command_dispatcher" module.
%%
%% This function returns "ok" immeidately and the scene info will
%% be responsed to user from player_fsm by sending responses to
%% DispatcherPid process.
%%
%% @end
%%--------------------------------------------------------------------
-spec exec(DispatcherPid, Uid, Direction) -> ok when
    Uid :: atom(),
    DispatcherPid :: pid(),
    Direction :: directions().
exec(DispatcherPid, Uid, Direction) ->
    case Direction of
        look ->
            player_fsm:look_scene(Uid, DispatcherPid);
        _ ->
            player_fsm:go_direction(Uid, DispatcherPid, Direction)
    end.

%%--------------------------------------------------------------------
%% @doc
%% Parse the direction atom from user input. This function has to be
%% called from command_dispactcher module is because the direction input
%% is does not has a fixed command prefix and so it has be pre-determined
%% at the very last when no other commands matched.
%%
%% @end
%%--------------------------------------------------------------------
-spec parse_direction(RawDirectionInput) -> directions() | undefined when
    RawDirectionInput :: atom().
parse_direction('6') -> east;
parse_direction('8') -> south;
parse_direction('4') -> west;
parse_direction('2') -> north;
parse_direction('3') -> northeast;
parse_direction('9') -> southeast;
parse_direction('7') -> southwest;
parse_direction('1') -> northwest;
parse_direction('5') -> look;

parse_direction(e) -> east;
parse_direction(s) -> south;
parse_direction(w) -> west;
parse_direction(n) -> north;
parse_direction(ne) -> northeast;
parse_direction(se) -> southeast;
parse_direction(sw) -> southwest;
parse_direction(nw) -> northwest;
parse_direction(l) -> look;

parse_direction(east) -> east;
parse_direction(south) -> south;
parse_direction(west) -> west;
parse_direction(north) -> north;
parse_direction(northeast) -> northeast;
parse_direction(southeast) -> southeast;
parse_direction(southwest) -> southwest;
parse_direction(northwest) -> northwest;
parse_direction(look) -> look;

parse_direction('East') -> east;
parse_direction('South') -> south;
parse_direction('West') -> west;
parse_direction('North') -> north;
parse_direction('Northeast') -> northeast;
parse_direction('Southeast') -> southeast;
parse_direction('Southwest') -> southwest;
parse_direction('Northwest') -> northwest;
parse_direction('Look') -> look;

parse_direction(_) -> undefined.

%%%===================================================================
%%% Internal functions
%%%===================================================================