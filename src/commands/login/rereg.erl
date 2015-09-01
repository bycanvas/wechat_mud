-module(rereg).
%% API
-export([exec/2]).

%%%-------------------------------------------------------------------
%%% @author Shuieryin
%%% @copyright (C) 2015, Shuieryin
%%% @doc
%%%
%%% @end
%%% Created : 01. Sep 2015 11:28 PM
%%%-------------------------------------------------------------------
-author("Shuieryin").

%%%===================================================================
%%% API
%%%===================================================================

%%--------------------------------------------------------------------
%% @doc
%% re-register user
%%
%% @end
%%--------------------------------------------------------------------
-spec exec(DispacherPid, State) -> string() when
    State :: map(),
    DispacherPid :: pid().
exec(DispacherPid, State) ->
    Uid = maps:get(uid, State),
    login_server:remove_user(Uid),
    login_server:register_uid(DispacherPid, Uid).

%%%===================================================================
%%% Internal functions
%%%===================================================================

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Comment starts here
%%
%% @end
%%--------------------------------------------------------------------