# rsync -avz --exclude '*.pyc' ~/bck_ctaOperatorGUI/ .

# -----------------------------------------------------------
all_files="ctaGuiUtils/py/*py ctaGuiBack/ctaGuiBack/*/*py ctaGuiBack/ctaGuiBack/__init__.py ctaGuiFront/ctaGuiFront/templates/view_common.jinja2 ctaGuiFront/ctaGuiFront/styles/general_style.css ctaGuiFront/ctaGuiFront/js/*.js ctaGuiFront/ctaGuiFront/js/*/*.js ctaGuiFront/ctaGuiFront/py/*.py ctaGuiFront/ctaGuiFront/__init__.py"
# -----------------------------------------------------------

# -----------------------------------------------------------
# subl $all_files 
# ls $all_files 
# find . \( -name "*.sed_bck" \) -print -exec /bin/rm -f {} \;
# -----------------------------------------------------------

# -----------------------------------------------------------
# PROBLEMS
# -----------------------------------------------------------
# sed -i .sed_bck 's/sessId/sess_id/g' $all_files
# sed -i .sed_bck 's/userId/user_id/g' $all_files
# sed -i .sed_bck 's/myLog/my_log/g' $all_files
# sed -i .sed_bck 's/getTime/get_time/g' $all_files
# sed -i .sed_bck 's/redisManager/redis_manager/g' $all_files
# sed -i .sed_bck 's/pubSubTest/pub_sub_test/g' $all_files
# sed -i .sed_bck 's/pubSub/pub_sub/g' $all_files
# sed -i .sed_bck 's/obsBlock/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/startTime/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/endTime/YYYYYYYY/g' $all_files


# -----------------------------------------------------------
# class/file names
# -----------------------------------------------------------
    # arrayData

# -----------------------------------------------------------
# BY HAND LATER
# -----------------------------------------------------------
# mySock.py:
    # widgetD
    # states0
    # getV
    # isSend
# ctaGuiUtils/py/utils.py
    # allWidgets
    # endTime
# ctaGuiFront/ctaGuiFront/js/widget_subArrGrp.js (eg: line-453 + "Id")
    # sed -i .sed_bck 's/trgId/trg_id/g' $all_files
    # sed -i .sed_bck 's/pntId/pnt_id/g' $all_files
# onsBlocks.py
    # telV


# BUGS:
    # zremrangebyscore
    # remove tel_id_types() from utils.py


# -----------------------------------------------------------
# OK
# -----------------------------------------------------------
sed -i .sed_bck 's/widgetId/widget_id/g' $all_files
# sed -i .sed_bck 's/threadIdGen/thread_id_gen/g' $all_files
# sed -i .sed_bck 's/threadType/thread_type/g' $all_files
# sed -i .sed_bck 's/threadToSigD/thread_sigs/g' $all_files
# sed -i .sed_bck 's/serverName/server_name/g' $all_files
# sed -i .sed_bck 's/sessExpire/sess_expire/g' $all_files
# sed -i .sed_bck 's/cleanupSleep/cleanup_sleep/g' $all_files
# sed -i .sed_bck 's/sessToEndpointD/sess_endpoints/g' $all_files
# sed -i .sed_bck 's/widgetInitV/widget_inits/g' $all_files
# sed -i .sed_bck 's/userGroup/user_group/g' $all_files
# sed -i .sed_bck 's/usrGrpId/user_group_id/g' $all_files
# sed -i .sed_bck 's/sessName/sess_name/g' $all_files
# sed -i .sed_bck 's/logSendPkt/log_send_packet/g' $all_files
# sed -i .sed_bck 's/initialConnect/initial_connect/g' $all_files
# sed -i .sed_bck 's/backFromOffline/back_from_offline/g' $all_files
# sed -i .sed_bck 's/allSessIds/all_sess_ids/g' $all_files
# sed -i .sed_bck 's/sessIdV/sess_ids/g' $all_files
# sed -i .sed_bck 's/widget_idV/widget_ids/g' $all_files
# sed -i .sed_bck 's/sessWidgetV/sess_widgets/g' $all_files
# sed -i .sed_bck 's/setOnlineState/set_online_state/g' $all_files
# sed -i .sed_bck 's/reConnect/reconnect/g' $all_files
# sed -i .sed_bck 's/joinSessionData/join_session_data/g' $all_files
# sed -i .sed_bck 's/joinSession/join_session/g' $all_files
# sed -i .sed_bck 's/sesIdNow/ses_id_now/g' $all_files
# sed -i .sed_bck 's/userIdV/user_ids/g' $all_files
# sed -i .sed_bck 's/userIds/user_ids/g' $all_files
# sed -i .sed_bck 's/sessHeartbeat/sess_heartbeat/g' $all_files
# sed -i .sed_bck 's/syncGroups/sync_groups/g' $all_files
# sed -i .sed_bck 's/userSessIds/user_sess_ids/g' $all_files
# sed -i .sed_bck 's/getThreadId/get_thread_id/g' $all_files
# sed -i .sed_bck 's/commonThread/shared_thread/g' $all_files
# sed -i .sed_bck 's/threadId/thread_id/g' $all_files
# sed -i .sed_bck 's/setThreadState/set_thread_state/g' $all_files
# sed -i .sed_bck 's/pubSubSocketEvtWidgetV/pubsub_socket_evt_widgets/g' $all_files
# sed -i .sed_bck 's/sessProps/sess_props/g' $all_files
# sed -i .sed_bck 's/socketEvtThisSession/socket_evt_session/g' $all_files
# sed -i .sed_bck 's/initUserToSyncLoopV/init_user_sync_loops/g' $all_files
# sed -i .sed_bck 's/nSessTry/n_sess_try/g' $all_files
# sed -i .sed_bck 's/widgetSource/widget_source/g' $all_files
# sed -i .sed_bck 's/widgetName/widget_name/g' $all_files
# sed -i .sed_bck 's/widgetGroup/widget_group/g' $all_files
# sed -i .sed_bck 's/nSyncGroup/n_sync_group/g' $all_files
# sed -i .sed_bck 's/syncType/sync_type/g' $all_files
# sed -i .sed_bck 's/doAllowPanelSync/allow_panel_sync/g' $all_files
# sed -i .sed_bck 's/allowedWidgetTypeV/allowed_widget_types/g' $all_files
# sed -i .sed_bck 's/isPanelSync/is_panel_sync/g' $all_files
# sed -i .sed_bck 's/notSynced/not_synced/g' $all_files
# sed -i .sed_bck 's/hasWgtId/has_widget_id/g' $all_files
# sed -i .sed_bck 's/userWidgetV/user_widgets/g' $all_files
# sed -i .sed_bck 's/socketEvtWidgetV/socket_event_widgets/g' $all_files
# sed -i .sed_bck 's/allWidgetV/all_sync_widgets/g' $all_files
# sed -i .sed_bck 's/widgetMod/widget_module/g' $all_files
# sed -i .sed_bck 's/widgetV/all_widgets/g' $all_files
# sed -i .sed_bck 's/nIcon/n_icon/g' $all_files
# sed -i .sed_bck 's/n_iconV/n_icons/g' $all_files
# sed -i .sed_bck 's/widgetState/widget_state/g' $all_files
# sed -i .sed_bck 's/widgetNow/widget_now/g' $all_files
# sed -i .sed_bck 's/syncGroupV/sync_groups/g' $all_files
# sed -i .sed_bck 's/defVal/default_val/g' $all_files
# sed -i .sed_bck 's/grpIndexV/group_indices/g' $all_files
# sed -i .sed_bck 's/grpIndex/group_index/g' $all_files
# sed -i .sed_bck 's/syncGroup/sync_group/g' $all_files
# sed -i .sed_bck 's/syncStateV/sync_states/g' $all_files
# sed -i .sed_bck 's/sync_typeV/sync_types/g' $all_files
# sed -i .sed_bck 's/iconId/icon_id/g' $all_files
# sed -i .sed_bck 's/sync_groupUpdate/update_sync_group/g' $all_files
# sed -i .sed_bck 's/methodName/method_name/g' $all_files
# sed -i .sed_bck 's/methodArgs/method_arg/g' $all_files
# sed -i .sed_bck 's/allowPanelSync/allow_panel_sync/g' $all_files
# sed -i .sed_bck 's/updateSyncGroups/update_sync_groups/g' $all_files
# sed -i .sed_bck 's/syncStateSend/sync_state_send/g' $all_files
# sed -i .sed_bck 's/dataIn/data_in/g' $all_files
# sed -i .sed_bck 's/optIn/opt_in/g' $all_files
# sed -i .sed_bck 's/activeWidget/active_widget/g' $all_files
# sed -i .sed_bck 's/allSyncIds/all_sync_ids/g' $all_files
# sed -i .sed_bck 's/syncStateGet/get_sync_state/g' $all_files
# sed -i .sed_bck 's/setActiveWidget/set_active_widget/g' $all_files
# sed -i .sed_bck 's/leaveSession/leave_session/g' $all_files
# sed -i .sed_bck 's/sendWidgetInit/send_init_widget/g' $all_files
# sed -i .sed_bck 's/dataFunc/data_func/g' $all_files
# sed -i .sed_bck 's/initData/init_data/g' $all_files
# sed -i .sed_bck 's/dataEmit/emit_data/g' $all_files
# sed -i .sed_bck 's/addWidgetTread/add_widget_tread/g' $all_files
# sed -i .sed_bck 's/updateData/update_data/g' $all_files
# sed -i .sed_bck 's/widgetThreadFunc/widget_thread_func/g' $all_files
# sed -i .sed_bck 's/threadFunc/thread_func/g' $all_files
# sed -i .sed_bck 's/wgtGrpToSessV/widget_group_sess/g' $all_files
# sed -i .sed_bck 's/sleepTime/sleep_seconds/g' $all_files
# sed -i .sed_bck 's/widgetType/widget_type/g' $all_files
# sed -i .sed_bck 's/evtName/event_name/g' $all_files
# sed -i .sed_bck 's/clearThreadsByType/clear_threads_type/g' $all_files
# sed -i .sed_bck 's/emitTime/emit_time/g' $all_files
# sed -i .sed_bck 's/threadTag/thread_tag/g' $all_files
# sed -i .sed_bck 's/thread_idNow/thread_id_now/g' $all_files
# sed -i .sed_bck 's/nEleNow/n_ele_now/g' $all_files
# sed -i .sed_bck 's/nEleNowInRow/n_ele_now_row/g' $all_files
# sed -i .sed_bck 's/nEleNowInCol/n_ele_now_col/g' $all_files
# sed -i .sed_bck 's/nEles/n_elements/g' $all_files
# sed -i .sed_bck 's/dataNow/data_now/g' $all_files
# sed -i .sed_bck 's/eleNow/ele_now/g' $all_files
# sed -i .sed_bck 's/n_ele_nowInRow/n_ele_now_row/g' $all_files
# sed -i .sed_bck 's/n_ele_nowInCol/n_ele_now_col/g' $all_files
# sed -i .sed_bck 's/sessIds/sess_ids_now/g' $all_files
# sed -i .sed_bck 's/cleanupSession/cleanup_session/g' $all_files
# sed -i .sed_bck 's/zombieIds/zombie_ids/g' $all_files
# sed -i .sed_bck 's/sockDict/socks/g' $all_files
# sed -i .sed_bck 's/viewLogin/view_login/g' $all_files
# sed -i .sed_bck 's/viewLogout/view_logout/g' $all_files
# sed -i .sed_bck 's/viewForbidden/view_forbidden/g' $all_files
# sed -i .sed_bck 's/viewIndex/view_index/g' $all_files
# sed -i .sed_bck 's/viewEmpty/view_empty/g' $all_files
# sed -i .sed_bck 's/viewNotFound/view_not_found/g' $all_files
# sed -i .sed_bck 's/viewCommon/view_common/g' $all_files
# sed -i .sed_bck 's/nsType/site_type/g' $all_files
# sed -i .sed_bck 's/appPrefix/app_prefix/g' $all_files
# sed -i .sed_bck 's/redisBase/redis_base/g' $all_files
# sed -i .sed_bck 's/unPackObj/unpack_object/g' $all_files
# sed -i .sed_bck 's/thisEmptyExample/this_empty_example/g' $all_files
# sed -i .sed_bck 's/isEmptySel/is_empty_selection/g' $all_files
# sed -i .sed_bck 's/isEmptyGrp/is_empty_group/g' $all_files
# sed -i .sed_bck 's/isEmpty/is_empty/g' $all_files
# sed -i .sed_bck 's/clipScore/clip_score/g' $all_files
# sed -i .sed_bck 's/redisPort/redis_port/g' $all_files
# sed -i .sed_bck 's/flatDictById/flatten_dict/g' $all_files
# sed -i .sed_bck 's/telIds/tel_ids/g' $all_files
# sed -i .sed_bck 's/idNow/id_now/g' $all_files
# sed -i .sed_bck 's/ignoreSubscribeMessages/ignore_subscribe_messages/g' $all_files
# sed -i .sed_bck 's/pipeManager/redis_pipe_manager/g' $all_files
# sed -i .sed_bck 's/packedScore/packed_score/g' $all_files
# sed -i .sed_bck 's/hasACS/has_acs/g' $all_files
# sed -i .sed_bck 's/emptySA/empty_sub_array/g' $all_files
# sed -i .sed_bck 's/noSubArrName/no_subArr_name/g' $all_files
# sed -i .sed_bck 's/telPos0/tel_pos_0/g' $all_files
# sed -i .sed_bck 's/useLogTitle/use_log_title/g' $all_files
# sed -i .sed_bck 's/addMsgEleSpace/add_msg_ele_space/g' $all_files
# sed -i .sed_bck 's/telIdToTelType/tel_id_types/g' $all_files
# sed -i .sed_bck 's/myLog/my_log/g' $all_files
# sed -i .sed_bck 's/doParseMsg/do_parse_msg/g' $all_files
# sed -i .sed_bck 's/useColors/use_colors/g' $all_files
# sed -i .sed_bck 's/setColors/set_colors/g' $all_files
# sed -i .sed_bck 's/parseMsg/parse_msg/g' $all_files
# sed -i .sed_bck 's/msgIn/msg_in/g' $all_files
# sed -i .sed_bck 's/msgNow/msg_now/g' $all_files
# sed -i .sed_bck 's/colorV/colors/g' $all_files
# sed -i .sed_bck 's/colFunc/color_func/g' $all_files
# sed -i .sed_bck 's/msgStr/msg_str/g' $all_files
# sed -i .sed_bck 's/getColDict/get_col_dict/g' $all_files
# sed -i .sed_bck 's/colDef/col_def/g' $all_files
# sed -i .sed_bck 's/colBlue/col_blue/g' $all_files
# sed -i .sed_bck 's/ColBlue/col_blue/g' $all_files
# sed -i .sed_bck 's/colRed/col_red/g' $all_files
# sed -i .sed_bck 's/ColRed/col_red/g' $all_files
# sed -i .sed_bck 's/colLightBlue/col_light_blue/g' $all_files
# sed -i .sed_bck 's/colYellow/col_yellow/g' $all_files
# sed -i .sed_bck 's/ColYellow/col_yellow/g' $all_files
# sed -i .sed_bck 's/colGreen/col_green/g' $all_files
# sed -i .sed_bck 's/colPurple/col_purple/g' $all_files
# sed -i .sed_bck 's/colCyan/col_cyan/g' $all_files
# sed -i .sed_bck 's/colUnderLine/col_underline/g' $all_files
# sed -i .sed_bck 's/colWhiteOnRed/col_white_on_red/g' $all_files
# sed -i .sed_bck 's/colWhiteOnBlack/col_white_on_black/g' $all_files
# sed -i .sed_bck 's/colWhiteOnGreen/col_white_on_green/g' $all_files
# sed -i .sed_bck 's/colWhiteOnYellow/col_white_on_yellow/g' $all_files
# sed -i .sed_bck 's/noCol/no_color/g' $all_files
# sed -i .sed_bck 's/myLock/my_lock/g' $all_files
# sed -i .sed_bck 's/checkEvery/seconds_to_check/g' $all_files
# sed -i .sed_bck 's/maxChecks/n_max_checks/g' $all_files
# sed -i .sed_bck 's/nChecked/n_checked/g' $all_files
# sed -i .sed_bck 's/onlyWarn/only_warn/g' $all_files
# sed -i .sed_bck 's/timeOfNight/time_of_night/g' $all_files
# sed -i .sed_bck 's/isActive/is_active/g' $all_files
# sed -i .sed_bck 's/timeScale/timescale/g' $all_files
# sed -i .sed_bck 's/className/class_name/g' $all_files
# sed -i .sed_bck 's/timeSeriesLen/time_series_n_seconds/g' $all_files
# sed -i .sed_bck 's/secondScale/second_scale/g' $all_files
# sed -i .sed_bck 's/resetNight/reset_night/g' $all_files
# sed -i .sed_bck 's/getTotalTime/get_total_time_seconds/g' $all_files
# sed -i .sed_bck 's/getNnight/get_n_night/g' $all_files
# sed -i .sed_bck 's/getTimeScale/get_timescale/g' $all_files
# sed -i .sed_bck 's/getCurrentTime/get_current_time/g' $all_files
# sed -i .sed_bck 's/getSecondScale/get_second_scale/g' $all_files
# sed -i .sed_bck 's/getResetTime/get_reset_time/g' $all_files
# sed -i .sed_bck 's/getRealTime/get_real_time/g' $all_files
# sed -i .sed_bck 's/getTimeSeriesStartTime/get_time_series_start_time/g' $all_files
# sed -i .sed_bck 's/getStartTime/get_start_time/g' $all_files
# sed -i .sed_bck 's/nNight/n_night/g' $all_files
# sed -i .sed_bck 's/realResetTime/real_reset_time/g' $all_files
# sed -i .sed_bck 's/timeNow/time_now/g' $all_files
# sed -i .sed_bck 's/nSleep/sleep_seconds/g' $all_files
# sed -i .sed_bck 's/getTimeOfNight/get_time_of_night/g' $all_files
# sed -i .sed_bck 's/dictModFunc/dict_module_func/g' $all_files
# sed -i .sed_bck 's/modFunc/module_func/g' $all_files
# sed -i .sed_bck 's/objTraverse/traverse_object/g' $all_files
# sed -i .sed_bck 's/newVals/new_values/g' $all_files
# sed -i .sed_bck 's/dataOut/data_out/g' $all_files
# sed -i .sed_bck 's/childVid/child_ids/g' $all_files
# sed -i .sed_bck 's/siblingVid/sibling_ids/g' $all_files
# sed -i .sed_bck 's/maxDepth/max_depth/g' $all_files
# sed -i .sed_bck 's/deltaSec/delta_seconds/g' $all_files
# sed -i .sed_bck 's/isMicro/is_microseconds/g' $all_files
# sed -i .sed_bck 's/nSec/n_seconds/g' $all_files
# sed -i .sed_bck 's/dateToStr/date_to_string/g' $all_files
# sed -i .sed_bck 's/dateIn/date_in/g' $all_files
# sed -i .sed_bck 's/timeStr/time_string/g' $all_files
# sed -i .sed_bck 's/floatStrFormat/format_float_to_string/g' $all_files
# sed -i .sed_bck 's/pdResampler/pd_resampler/g' $all_files
# sed -i .sed_bck 's/arrIn/arr_in/g' $all_files
# sed -i .sed_bck 's/hasDataResampler/has_data_resampler/g' $all_files
# sed -i .sed_bck 's/formatUnits/format_units/g' $all_files
# sed -i .sed_bck 's/unitsIn/units_in/g' $all_files
# sed -i .sed_bck 's/doDataUpdates/do_data_updates/g' $all_files
# sed -i .sed_bck 's/getDataInit/get_init_data/g' $all_files
# sed -i .sed_bck 's/panelSync_getGroups/panelSync_get_groups/g' $all_files
# sed -i .sed_bck 's/nGrpWidg/n_widget_group/g' $all_files
# sed -i .sed_bck 's/childV_0/children_0/g' $all_files
# sed -i .sed_bck 's/childV_1/children_1/g' $all_files
# sed -i .sed_bck 's/childV_2/children_2/g' $all_files
# sed -i .sed_bck 's/rmEleV/rm_elements/g' $all_files
# sed -i .sed_bck 's/rmEle/rm_element/g' $all_files
# sed -i .sed_bck 's/allGrps/all_groups/g' $all_files
# sed -i .sed_bck 's/Assert/my_assert/g' $all_files
# sed -i .sed_bck 's/addFact/add_factor/g' $all_files
# sed -i .sed_bck 's/xyNow/xy_now/g' $all_files
# sed -i .sed_bck 's/getTelHealthD/get_tel_healths/g' $all_files
# sed -i .sed_bck 's/telId/tel_Id/g' $all_files
# sed -i .sed_bck 's/lBlue/light_blue/g' $all_files
# sed -i .sed_bck 's/whtOnBlck/white_on_black/g' $all_files
# sed -i .sed_bck 's/redOnBlck/red_on_black/g' $all_files
# sed -i .sed_bck 's/bluOnBlck/blue_on_black/g' $all_files
# sed -i .sed_bck 's/yellOnBlck/yellow_on_black/g' $all_files
# sed -i .sed_bck 's/whtOnRed/white_on_red/g' $all_files
# sed -i .sed_bck 's/yellowOnRed/yellow_on_red/g' $all_files
# sed -i .sed_bck 's/whtOnYellow/white_on_yellow/g' $all_files
# sed -i .sed_bck 's/whtOnGreen/white_on_green/g' $all_files
# sed -i .sed_bck 's/nDigits/n_digits/g' $all_files
# sed -i .sed_bck 's/setPubSub/set_pub_sub/g' $all_files
# sed -i .sed_bck 's/getPubSub/get_pub_sub/g' $all_files
# sed -i .sed_bck 's/cycleBlocks/cycle_blocks/g' $all_files
# sed -i .sed_bck 's/activeSchedBlock/active_sched_block/g' $all_files
# sed -i .sed_bck 's/nSchedSubs/n_sched_subs/g' $all_files
# sed -i .sed_bck 's/nInitCycle/n_init_cycle/g' $all_files
# sed -i .sed_bck 's/namePrefix/name_prefix/g' $all_files
# sed -i .sed_bck 's/scriptName/script_name/g' $all_files
# sed -i .sed_bck 's/maxNcycles/max_n_cycles/g' $all_files
# sed -i .sed_bck 's/minNschedBlock/min_n_sched_block/g' $all_files
# sed -i .sed_bck 's/maxNschedBlock/max_n_sched_block/g' $all_files
# sed -i .sed_bck 's/minNobsBlock/min_n_obs_block/g' $all_files
# sed -i .sed_bck 's/maxNobsBlock/max_n_obs_block/g' $all_files
# sed -i .sed_bck 's/minNtelBlock/min_n_tel_block/g' $all_files
# sed -i .sed_bck 's/maxNfreeTels/max_n_free_tels/g' $all_files
# sed -i .sed_bck 's/obsBlockDuration/obs_block_seconds/g' $all_files
# sed -i .sed_bck 's/durationScale/duration_scale/g' $all_files
# sed -i .sed_bck 's/prevResetTime/prev_reset_time/g' $all_files
# sed -i .sed_bck 's/azMinMax/az_min_max/g' $all_files
# sed -i .sed_bck 's/zenMinMaxTel/zen_min_max_tel/g' $all_files
# sed -i .sed_bck 's/zenMinMaxPnt/zen_min_max_pnt/g' $all_files
# sed -i .sed_bck 's/loopSleep/loop_sleep/g' $all_files
# sed -i .sed_bck 's/rndSeed/rnd_seed/g' $all_files
# sed -i .sed_bck 's/rndGen/rnd_gen/g' $all_files
# sed -i .sed_bck 's/setActiveSchedBlocks/set_active_sched_blocks/g' $all_files
# sed -i .sed_bck 's/hasLock/has_lock/g' $all_files
# sed -i .sed_bck 's/cancelSchedBlocks/cancel_sched_blocks/g' $all_files
# sed -i .sed_bck 's/schedBlockId/sched_block_id/g' $all_files
# sed -i .sed_bck 's/cancelZombieSchedBlocks/cancel_zombie_sched_blocks/g' $all_files
# sed -i .sed_bck 's/schedBlkIds/sched_block_ids/g' $all_files
# sed -i .sed_bck 's/schedBlkIdNow/sched_block_id_now/g' $all_files
# sed -i .sed_bck 's/initBlockCycle/init_block_cycle/g' $all_files
# sed -i .sed_bck 's/debugTmp/debug_tmp/g' $all_files
# sed -i .sed_bck 's/metaData/metadata/g' $all_files
# sed -i .sed_bck 's/overheadDuration/overhead_seconds/g' $all_files
# sed -i .sed_bck 's/isCycleDone/is_cycle_done/g' $all_files
# sed -i .sed_bck 's/nCycleNow/n_cycle_now/g' $all_files
# sed -i .sed_bck 's/totBlockDuration/tot_block_seconds/g' $all_files
# sed -i .sed_bck 's/maxBlockDuration/max_block_seconds/g' $all_files
# sed -i .sed_bck 's/baseName/base_name/g' $all_files
# sed -i .sed_bck 's/nTels/n_tels/g' $all_files
# sed -i .sed_bck 's/nSchedBlks/n_sched_blocks/g' $all_files
# sed -i .sed_bck 's/trgPos/target_pos/g' $all_files
# sed -i .sed_bck 's/cycle_blocksNow/cycle_blocks_now/g' $all_files
# sed -i .sed_bck 's/totSchedBlockDuration/tot_sched_block_seconds/g' $all_files
# sed -i .sed_bck 's/nSchedNow/n_sched_block_now/g' $all_files
# sed -i .sed_bck 's/nTelNow/n_tel_now/g' $all_files
# sed -i .sed_bck 's/schedTelIds/sched_tel_ids/g' $all_files
# sed -i .sed_bck 's/schedTelIdNow/sched_tel_id_now/g' $all_files
# sed -i .sed_bck 's/telType/tel_type/g' $all_files
# sed -i .sed_bck 's/schedConf/sched_conf/g' $all_files
# sed -i .sed_bck 's/nObsBlocks/n_obs_blocks/g' $all_files
# sed -i .sed_bck 's/nTrg/n_trg/g' $all_files
# sed -i .sed_bck 's/nPnt/n_pnt/g' $all_files
# sed -i .sed_bck 's/deltaAz/delta_az/g' $all_files
# sed -i .sed_bck 's/deltaZen/delta_zen/g' $all_files
# sed -i .sed_bck 's/targetIdsNow/target_ids_now/g' $all_files
# sed -i .sed_bck 's/targetId/target_id/g' $all_files
# sed -i .sed_bck 's/obsBlockV/obs_blocks/g' $all_files
# sed -i .sed_bck 's/totObsBlockDuration/tot_obs_block_seconds/g' $all_files
# sed -i .sed_bck 's/obsBlockStartTime/obs_block_duration/g' $all_files
# sed -i .sed_bck 's/nObsNow/n_obs_now/g' $all_files
# sed -i .sed_bck 's/obsBlockId/obs_block_id/g' $all_files
# sed -i .sed_bck 's/obsBlock_/obs_block_/g' $all_files
# sed -i .sed_bck 's/scaledDuration/scaled_duration/g' $all_files
# sed -i .sed_bck 's/obsCords/obs_coords/g' $all_files
# sed -i .sed_bck 's/obsMode/obs_mode/g' $all_files
# sed -i .sed_bck 's/obsSrc/obs_source/g' $all_files
# sed -i .sed_bck 's/obsCond/obs_conds/g' $all_files
# sed -i .sed_bck 's/targetName/target_name/g' $all_files
# sed -i .sed_bck 's/pntPos/point_pos/g' $all_files
# sed -i .sed_bck 's/trg_/target_/g' $all_files
# sed -i .sed_bck 's/trgtPnt/target_point/g' $all_files
# sed -i .sed_bck 's/trgPntId/target_point_id/g' $all_files
# sed -i .sed_bck 's/trgScale/target_scale/g' $all_files
# sed -i .sed_bck 's/trgNow/trg_now/g' $all_files
# sed -i .sed_bck 's/trgTry/trg_try/g' $all_files
# sed -i .sed_bck 's/nSchedBlocks/n_sched_blocks/g' $all_files
# sed -i .sed_bck 's/nSched/n_sched/g' $all_files
# sed -i .sed_bck 's/nObs/n_obs/g' $all_files
# sed -i .sed_bck 's/blockName/block_name/g' $all_files
# sed -i .sed_bck 's/schedBlkId/sched_blk_id/g' $all_files
# sed -i .sed_bck 's/schedBlk/sched_block/g' $all_files
# sed -i .sed_bck 's/timeStamp/timestamp/g' $all_files
# sed -i .sed_bck 's/setBlocks/set_blocks/g' $all_files
# sed -i .sed_bck 's/obsBlockDelays/obs_block_delays/g' $all_files
# sed -i .sed_bck 's/obsBlocksStatus/obs_blocks_status/g' $all_files
# sed -i .sed_bck 's/obsBlockNow/obs_block_now/g' $all_files
# sed -i .sed_bck 's/startTime_executed/start_time_exe/g' $all_files
# sed -i .sed_bck 's/startTime_planed/start_time_plan/g' $all_files
# sed -i .sed_bck 's/timeDifMax/time_dif_max/g' $all_files
# sed -i .sed_bck 's/timeDifNow/time_dif_now/g' $all_files
# sed -i .sed_bck 's/timeDif/time_dif/g' $all_files
# sed -i .sed_bck 's/updatedObsBlocks/updated_obs_blocks/g' $all_files
# sed -i .sed_bck 's/delaySchedBlks/delay_sched_blocks/g' $all_files
# sed -i .sed_bck 's/sched_blocOverV/sched_block_overs/g' $all_files
# sed -i .sed_bck 's/submitBlockCycle/submit_block_cycle/g' $all_files
# sed -i .sed_bck 's/hasResetNight/has_reset_night/g' $all_files
# sed -i .sed_bck 's/submitOneBlock/submit_one_block/g' $all_files
# sed -i .sed_bck 's/nSubTries/n_sub_tries/g' $all_files
# sed -i .sed_bck 's/blkMeta/block_meta/g' $all_files
# sed -i .sed_bck 's/blkTimes/block_times/g' $all_files
# sed -i .sed_bck 's/checkSchedBlocks/check_sched_blocks/g' $all_files
# sed -i .sed_bck 's/sbName/block_name/g' $all_files
# sed -i .sed_bck 's/createTarget/create_target/g' $all_files
# sed -i .sed_bck 's/nbTarget/n_rnd_targets/g' $all_files
# sed -i .sed_bck 's/exePhases/phases_exe/g' $all_files
# sed -i .sed_bck 's/run_takeData/run_take_data/g' $all_files
# sed -i .sed_bck 's/targetsIds/target_ids/g' $all_files
# sed -i .sed_bck 's/idIndex/n_id/g' $all_files
# sed -i .sed_bck 's/exePhase/exe_phase/g' $all_files
# sed -i .sed_bck 's/exeState/exe_state/g' $all_files
# sed -i .sed_bck 's/nbDividing/n_rnd_divs/g' $all_files
# sed -i .sed_bck 's/totTelIds/all_tel_ids/g' $all_files
# sed -i .sed_bck 's/allBlocks/all_obs_blocks/g' $all_files
# sed -i .sed_bck 's/external_clockEvents/external_clock_events/g' $all_files
# sed -i .sed_bck 's/updateExeStatusLists/update_exe_statuses/g' $all_files
# sed -i .sed_bck 's/getObsBlockTemplate/get_obs_block_template/g' $all_files
# sed -i .sed_bck 's/waitToRun/wait_to_run/g' $all_files
# sed -i .sed_bck 's/runToDone/run_to_done/g' $all_files
# sed -i .sed_bck 's/runPhase/run_phase/g' $all_files
# sed -i .sed_bck 's/external_generateEvents/external_generate_events/g' $all_files
# sed -i .sed_bck 's/hasChange/has_change/g' $all_files
# sed -i .sed_bck 's/waitV/wait_blocks/g' $all_files
# sed -i .sed_bck 's/obIdNow/obs_block_id_now/g' $all_files
# sed -i .sed_bck 's/obId/obs_block_id/g' $all_files
# sed -i .sed_bck 's/sbId/sched_block_id/g' $all_files
# sed -i .sed_bck 's/targetPos/target_pos/g' $all_files
# sed -i .sed_bck 's/pointingId/point_id/g' $all_files
# sed -i .sed_bck 's/pointingName/pointing_name/g' $all_files
# sed -i .sed_bck 's/pointingPos/pointing_pos/g' $all_files
# sed -i .sed_bck 's/allTelIdsIn/all_tel_ids_in/g' $all_files
# sed -i .sed_bck 's/nBlock/n_block/g' $all_files
# sed -i .sed_bck 's/blkTelIds/block_tel_ids/g' $all_files
# sed -i .sed_bck 's/pntN/pointing_name/g' $all_files
# sed -i .sed_bck 's/allTelIds/all_tel_ids/g' $all_files
# sed -i .sed_bck 's/updateSubArrs/update_subArrs/g' $all_files
# sed -i .sed_bck 's/clenaUp/cleanup/g' $all_files
# sed -i .sed_bck 's/errorRndFrac/error_rnd_frac/g' $all_files
# sed -i .sed_bck 's/phaseRndFrac/phase_rnd_frac/g' $all_files
# sed -i .sed_bck 's/external_generateClockEvents/external_generate_clock_events/g' $all_files
# sed -i .sed_bck 's/blockUpdate/obs_block_update/g' $all_files
# sed -i .sed_bck 's/canRun/can_run/g' $all_files
# sed -i .sed_bck 's/runV/runs/g' $all_files
# sed -i .sed_bck 's/newEvent/new_event/g' $all_files
# sed -i .sed_bck 's/external_addNewBlocksFromRedis/external_add_new_redis_blocks/g' $all_files

grep external_add_new_redis_blocks $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YYYYYYYY/g' $all_files








# sed -i .sed_bck 's/blockQueueBib/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/getBlocksRows/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/getBlocks/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/currentBlocks/YYYYYYYY/g' $all_files


# -----------------------------------------------------------
find . \( -name "*.sed_bck" \) -exec /bin/rm -f {} \;
# -----------------------------------------------------------
# -----------------------------------------------------------

