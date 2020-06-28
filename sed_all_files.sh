# rsync -avz --exclude '*.pyc' ~/bck_ctaOperatorGUI/ .

# -----------------------------------------------------------
# DO NOT include ctaGuiBack/ctaGuiBack/acs !!!!!!!!!!!
# -----------------------------------------------------------
all_files="ctaGuiUtils/py/*py ctaGuiBack/ctaGuiBack/py/*py ctaGuiBack/ctaGuiBack/__init__.py ctaGuiFront/ctaGuiFront/templates/view_common.jinja2 ctaGuiFront/ctaGuiFront/styles/general_style.css ctaGuiFront/ctaGuiFront/js/*/*.js ctaGuiFront/ctaGuiFront/js/*/*/*.js ctaGuiFront/ctaGuiFront/py/*.py ctaGuiFront/ctaGuiFront/py/*/*.py ctaGuiFront/ctaGuiFront/__init__.py ctaGuiFront/ctaGuiFront/scripts/*py"
# -----------------------------------------------------------

# -----------------------------------------------------------
# subl $all_files 
# ls $all_files 
# find . \( -name "*.sed_bck" \) -print -exec /bin/rm -f {} \;
# -----------------------------------------------------------


# grep '# ---------------------------------------------------------------------------' $all_files
# sed -i .sed_bck 's/iteritems/items/g' $all_files


grep "gevent-socketio" $all_files







# sed -i .sed_bck 's/XXXXXXXXXXXX/YvYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YvYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YvYYYYYYY/g' $all_files

# grep getTime $all_files
# sed 's/pointingIcon/ /g' $all_files | sed 's/EmptyIcon/ /g' | sed 's/targetIcon/ /g' | grep Icon

# eslint --fix js/utils/*js js/utils/*/*js js/widgets/*js
# $VENV/bin/autopep8 -i py/widgets/*py py/utils/*py py/__init__.py __init__.py

# -----------------------------------------------------------
# PROBLEMS
# -----------------------------------------------------------
# sed -i .sed_bck 's/getTime/get_time/g' $all_files
# sed -i .sed_bck 's/startTime/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/endTime/YYYYYYYY/g' $all_files
# sed -i .sed_bck 's/XXXXXXXXXXXX/YvYYYYYYY/g' $all_files


# -----------------------------------------------------------
# cleanup of backups
# -----------------------------------------------------------
# find . \( -name "*.pyc" \) -exec /bin/rm -f {} \;
find . \( -name "*.sed_bck" \) -exec /bin/rm -f {} \;
# -----------------------------------------------------------


# -----------------------------------------------------------
# BY HAND LATER
# -----------------------------------------------------------
# ctaGuiFront/ctaGuiFront/js/widget_subArrGrp.js (eg: line-453 + "Id")
# onsBlocks.py
    # telV


