# source these env variables before running the package (modify <absolute-path-to-install-dir>)
export ctaBaseDir="<absolute-path-to-install-dir>"
export VENV=$ctaBaseDir/venv
export pythonPathAdd=$ctaBaseDir:$ctaBaseDir/utils/:$ctaBaseDir/data_manager/:$ctaBaseDir/frontend_manager/frontend_manager/py/:
export PYTHONPATH=$pythonPathAdd$PYTHONPATH

echo '---------------------------------------------------------------------------------'
echo " - env settings:"
echo '-------------------------------------'
echo "python        --> `which python`"
echo "`python --version`"
echo "ctaBaseDir    --> $ctaBaseDir"
echo "VENV          --> $VENV"
echo "pythonPathAdd --> $pythonPathAdd"
echo ""
echo '-------------------------------------'
echo " - execute in a terminal:"
echo '-------------------------------------'
echo "cd $ctaBaseDir/data_manager/"
echo "$VENV/bin/python run_server.py --site_type=N"
echo ""
echo " - and in a different terminal:"
echo '-------------------------------------'
echo "cd $ctaBaseDir/frontend_manager/"
echo "$VENV/bin/python run_server.py --site_type=N"
echo ""
echo " - for default settings, expects redis running on port 8091 (--site_type=N) or 8096 (--site_type=S)"
echo '---------------------------------------------------------------------------------'
