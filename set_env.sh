# source these env variables before running the package (modify <absolute-path-to-install-dir>)
export hmiBaseDir="<absolute-path-to-install-dir>"
export VENV="$hmiBaseDir/venv"
export pythonPathAdd="$hmiBaseDir:$hmiBaseDir/utils/:$hmiBaseDir/data_manager/:$hmiBaseDir/frontend_manager/frontend_manager/py/:"
export PYTHONPATH="$pythonPathAdd$PYTHONPATH"

echo '---------------------------------------------------------------------------------'
echo " - env settings:"
echo '-------------------------------------'
echo "python        --> `which python`"
echo "`python --version`"
echo "hmiBaseDir    --> $hmiBaseDir"
echo "VENV          --> $VENV"
echo "pythonPathAdd --> $pythonPathAdd"
echo ""
echo '-------------------------------------'
echo " - execute in a terminal:"
echo '-------------------------------------'
echo "cd $hmiBaseDir/data_manager/"
echo "$VENV/bin/python run_server.py --site_type=N"
echo ""
echo " - and in a different terminal:"
echo '-------------------------------------'
echo "cd $hmiBaseDir/frontend_manager/"
echo "$VENV/bin/python run_server.py --site_type=N"
echo ""
echo " - for default settings, expects redis running on port 8091 (--site_type=N) or 8096 (--site_type=S)"
echo '---------------------------------------------------------------------------------'
