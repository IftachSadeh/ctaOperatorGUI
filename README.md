# ctaOperatorGUI v0.1.0

## Overview

The prototype for the operator GUI of the Cherenkov Telescope Array (CTA) [https://www.cta-observatory.org/](https://www.cta-observatory.org/).

For additional information, see:
  - Prototyping the graphical user interface for the operator of the Cherenkov Telescope Array, [arXiv:1608.03595](https://arxiv.org/abs/1608.03595).
  - The Graphical User Interface of the Operator of the Cherenkov Telescope Array, [arXiv:1710.07117](https://arxiv.org/abs/1710.07117).
  - [This talk](https://youtu.be/8ZvUj-DHSgE?list=PLSmiVc92qFFJG0kPQtYK0Y33fj00rcVkL), given at the ICALEPCS 2017 conference.

## Installing and running the server

### Dependencies 

- The package is based on several open source projects:
  - [Pyramid](http://docs.pylonsproject.org/projects/pyramid/en/latest/index.html) is used as a python web server.
  - Asynchronous communication between server and client is performed using [socket.io](http://socket.io/).
  - Visualizations are performed using the [d3.js](https://d3js.org/) JavaScript library.
  - JavaScript dependencies are handles by the [`bower` package manager](https://bower.io/).
  - The package uses the [`redis`](https://redis.io/) database.

  Additionally, `ctaGuiBack` implements an interface to the ALMA Common Software (ACS). However, ACS is not required in order to run the package.

- Development is being done using `python v2.7` and `d3.js v4.1`.

### First-time setup

- Define some environment variables:
  ```bash
    export ctaBaseDir="<absolute-path-to-install-dir>"
    export VENV=$ctaBaseDir/venv
    export PATH=$VENV:$PATH
    export PYTHONPATH=$VENV/lib/python2.7/:$VENV/lib/python2.7/site-packages/:$VENV:$PYTHONPATH
    export PYTHONPATH=$ctaBaseDir:$ctaBaseDir/ctaGuiUtils/py/:$ctaBaseDir/ctaGuiBack/ctaGuiBack/py/:$ctaBaseDir/ctaGuiFront/ctaGuiFront/py/:$PYTHONPATH
    export POLICY_SERVER=False
  ```
    - Modify `absolute-path-to-install-dir` to be the top directory of the package.
    - These variables should be defined before the package is run in a new session.
    - Modify `python2.7` in the above, depending on your version of python.

- Check that setuptools work (should just exit with no error):
  ```bash
    python -c 'import setuptools'
  ```

- Create a `virtualenv` and install some packages (formatting/linter packages optional):
  ```bash
    mkdir -p $VENV

    easy_install --install-dir=$VENV virtualenv
    virtualenv $VENV

    $VENV/bin/easy_install "gevent==1.0.2"
    $VENV/bin/easy_install gevent-websocket gevent-socketio
    $VENV/bin/easy_install gunicorn pyramid_jinja2
    $VENV/bin/easy_install zope.interface zope.sqlalchemy zope.deprecation SQLAlchemy transaction
    $VENV/bin/easy_install msgpack-python redis numpy
    $VENV/bin/pip install pep8 yapf
    npm install eslint
  ```
  for `python v2.7` (currently for ACS compatibility), older versions are necessary:
  ```bash
    easy_install --install-dir=$VENV "virtualenv==15.1.0"
    virtualenv $VENV
    $VENV/bin/easy_install "gevent==1.0.2"
    $VENV/bin/easy_install "gevent-websocket==0.10.1" "gevent-socketio==0.3.6"
    $VENV/bin/easy_install "gunicorn==19.8.1"
    $VENV/bin/easy_install "pyramid==1.9.2" "Jinja2==2.10" "pyramid_jinja2==2.7"
    $VENV/bin/easy_install "zope.sqlalchemy==1.0" "zope.interface==4.5.0"  "zope.deprecation==4.3.0"
    $VENV/bin/easy_install "SQLAlchemy==1.2.8" "transaction==2.2.1"
    $VENV/bin/easy_install "redis==2.10.6"
    $VENV/bin/easy_install "msgpack-python==0.5.6"
    $VENV/bin/pip install pep8 yapf
  ```


- Setup the two sub-packages, `ctaGuiBack` and `ctaGuiFront`:
  ```bash
    cd $ctaBaseDir/ctaGuiBack/
    mkdir -p $ctaBaseDir/ctaGuiBack/logs
    $VENV/bin/python setup.py develop

    cd $ctaBaseDir/ctaGuiFront/
    mkdir -p $ctaBaseDir/ctaGuiFront/logs
    $VENV/bin/python setup.py develop
    $VENV/bin/initialize_tutorial_db config_north.ini
    bower install
  ```
    - Notice that the `bower` package manager should be pre-installed.

### Running the package

- `redis` must be running on port `6379` for the North site, and `6378` for the South (configurable in the `config_north.ini` and `config_south.ini` files as `redis_port`).

- Run the two servers (in two separate sessions) after sourcing the environment variables defined above, having the option of running either the North or the South site versions:
  ```bash
    cd $ctaBaseDir/ctaGuiBack/
    $VENV/bin/gunicorn --bind 0.0.0.0:8888 --paste config_north.ini
  ```

  ```bash  
    cd $ctaBaseDir/ctaGuiFront/
    $VENV/bin/gunicorn --bind 0.0.0.0:8090 --paste config_north.ini
  ```
  or:
  ```bash
    cd $ctaBaseDir/ctaGuiBack/
    $VENV/bin/gunicorn --bind 0.0.0.0:8889 --paste config_south.ini
  ```

  ```bash  
    cd $ctaBaseDir/ctaGuiFront/
    $VENV/bin/gunicorn --bind 0.0.0.0:8091 --paste config_south.ini
  ```

- View the client in a web browser, by navigating to `http://localhost:8090/cta/index`.

## Adding a new widget in a new view

The following details the minimal procedure to add a new widget, `TestExample`, bootstrapped from the `EmptyExample` widget. In this example, the new widget will be added to a new view, called `TestView`. In general, any widget may be added to an existing view (i.e., skip steps 3-4 below, to avoid creating a dedicated view).

- Create a copy of the `EmptyExample` JavaScript/python files with the new widget name. Notice that we need to replace the the listed permutations of capitalisation in different places:
```bash

  cd ctaGuiFront/ctaGuiFront
  sed "s/EmptyExample/TestExample/g" js/widgets/EmptyExample.js | sed "s/empty_example/test_example/g" > js/widgets/TestExample.js
  sed "s/EmptyExample/TestExample/g" py/widgets/EmptyExample.py | sed "s/empty_example/test_example/g" > py/widgets/TestExample.py
  ```
    It is important to keep the naming scheme consistent (including capitalisation), and to make sure that the `main_script_tag` variable in `js/widgets/TestExample.js` is set to the exact widget name.

- Make the following modifications:
  1. In `ctaGuiUtils/py/BaseConfig.py`: add the new widget (`TestExample`) to `allowed_widget_types`. This `dict` is used to make sure that a dynamically added widget-class (i.e., `ctaGuiFront/ctaGuiFront/py/widgets/TestExample.py`) is valid.
  2. In `ctaGuiUtils/py/BaseConfig.py`: add the new view (`myNewView`) to `utils.all_widgets`. This lets the server know that the new URL (`http://localhost:8090/cta/myNewView`) is valid.
  3. In `ctaGuiFront/ctaGuiFront/js/utils/setup_view.js`: add the new view and the new widget to `setup_view` (copy the entry for `TestExample`). Here the widgets which are loaded in a given view are defined. The new widget may also be added to an existing view.
  4. In `ctaGuiFront/ctaGuiFront/js/utils/BaseApp.js`: add the new view (`myNewView`) to the `add_site_nav_menu` function  (copy the entry for `TestExample`). This will add an entry to the new view in the main navigation menu in the index page and in side-menu.


## Comments

### General

- Strictly speaking, the `ctaGuiBack` sub-package doesn't have to be run with `gunicorn` (it does not act as a web server, nor does it really need to occupy a socket). Using `gunicorn` is just convenient for development purposes, and may in the future be used to serve a debugging interface for the `redis` server.

- If running the server on a remote machine, one may connect using an ssh tunnel. From the local machine, run
  ```bash
  ssh MyUserName@myServer -L8092:localhost:8090
  ```
  then, for this example, navigate to `http://127.0.0.1:8092/cta`.

- Here we use version `1.0.2` of `gevent`. This is due to a bug with version `0.2.1` of `gevent_socketio`. (The latter has been fixed, but has not yet made it to a release version, as of July 2016). If for some reason the latest version of `gevent` is used, the bug in `gevent_socketio` can easily be fixed by hand. The solution is given in the first comment at [gevent-socketio/issues/233](https://github.com/abourget/gevent-socketio/issues/233).

### Authentication

We generated a local database file for users and passwords by running
```bash
$VENV/bin/initialize_tutorial_db config_north.ini
```
which creates the file, `ctaGuiFront/ctaGuiFront.db`.
  
This script depends on `ctaGuiFront/ctaGuiFront/py/models.py`, in which the lists of users, passwords and groups (permissions) are defined. For instance, `["guest","1234","group:permit_1"]` from the function `initUsers()` defines a user-name `guest`, with a password `1234` which belongs to the group `group:permit_1`. The permission types for each group are defined as part of the `__acl__` variable. E.g., 
```python
__acl__ = [
    ...
    (Allow, 'group:permit_1', 'permit_a'),
    (Allow, 'group:permit_1', 'permit_b'),
    (Allow, 'group:permit_2', 'permit_b')
  ]
```
Here group `group:permit_1` has access to pages with permissions `permit_a` or `permit_b`, while group `group:permit_2` has access only to pages with permission `permit_b`.

The corresponding groups are used in `ctaGuiFront/ctaGuiFront/__init__.py` to define pages which only members of this group may access. This is a very simplistic method for authentication for development purposes - one can add `ssl` support to the `gunicorn` server, but this is not recommended. This procedure should be replaced or supplemented with a reverse-proxy server for production. For example, choosing `apache` as the reverse-proxy, one may use the following `httpd.conf` configuration directives:
```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_html_module modules/mod_proxy_html.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule xml2enc_module modules/mod_xml2enc.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so

ProxyRequests Off
ProxyPreserveHost On

<Proxy *>
  Order deny,allow
  Allow from all
</Proxy>

# may also configure on a given ip only (with a specific port) using <VirtualHost 127.0.0.4:80>
Listen 8070
<VirtualHost *:8070>
  Define appPrefix cta
  Define appPort 8090

  ServerName ${appPrefix}.com

  # (fake ssl cert, created as in http://www.akadia.com/services/ssh_test_certificate.html)
  SSLEngine on
  SSLCertificateFile "/home/vagrant/apache/ssl/server.crt"
  SSLCertificateKeyFile "/home/vagrant/apache/ssl/server.key"

  ProxyPass /${appPrefix} http://localhost:${appPort}/${appPrefix}
  ProxyPassReverse /${appPrefix} http://localhost:${appPort}/${appPrefix}

  ProxyPass /styles/ http://localhost:${appPort}/styles/
  ProxyPass /bower_components/ http://localhost:${appPort}/bower_components/
  ProxyPass /static/ http://localhost:${appPort}/static/
  ProxyPass /js/ http://localhost:${appPort}/js/
  ProxyPass /templates/ http://localhost:${appPort}/templates/

  ProxyPassReverse /styles/ http://localhost:${appPort}/styles/
  ProxyPassReverse /bower_components/ http://localhost:${appPort}/bower_components/
  ProxyPassReverse /static/ http://localhost:${appPort}/static/
  ProxyPassReverse /js/ http://localhost:${appPort}/js/
  ProxyPassReverse /templates/ http://localhost:${appPort}/templates/

  ProxyPass        /socket.io http://localhost:${appPort}/socket.io
  ProxyPassReverse /socket.io http://localhost:${appPort}/socket.io

  <Location /${appPrefix}>
     ProxyPassReverse /${appPrefix}
     Order allow,deny
     Allow from all
  </Location>  

  <Location /${appPrefix}>
   AuthType Basic
   AuthName "blabla"
   AuthUserFile "htpasswdFile"
   require valid-user
  </Location>

  RewriteEngine on
  RewriteCond %{REQUEST_URI}  ^/socket.io/1/websocket  [NC]
  RewriteRule /(.*)           ws://localhost:${appPort}/$1 [P,L]

  AddType text/css .css 
  AddType text/javascript .js
</VirtualHost>
```
Notice that you need to first generate the `htpasswdFile` file, as e.g.,
```bash
htpasswd -c htpasswdFile myUserName
```
with a given user name for log-in, `myUserName`. The `htpasswdFile` file should be place in the `ServerRoot` directory of apache.
The local server, running under `http://localhost:8090/cta`, will then be served by `apache` under `https://localhost:8070/cta`.

### Server domain

One may change the `host`, `port` and `app_prefix` in `config_north.ini`. For example, the following will set the server to run under `http://127.0.0.1:8095/myOwnPrefix`:
```python
[server:main]
....
app_prefix = myOwnPrefix
host       = 127.0.0.1
port       = 8095
```

### Logging streams

Logging is done with the usual `python` module. Logger formats are set in `config_north.ini`. By default, all are written to files under `logs/`.
Some of the streams are also written to the console. In order to add (remove) a log stream from the console, change the corresponding `propagate` flag to 1 (0). For example, the `logger_guni` logger is written both to file and to the console
```python
[logger_guni]
....
propagate = 1
```

### Timeout

The `config_north.ini` file includes:
```bash
[server:main]
......
timeout = 600
```
The `timeout` sets the maximal time for a greenlet (a gunicorn thread) to be able to block with a a CPU intensive task or while waiting for some external function call.

### Styling conventions

- The python code complies with `pep8`/[`yapf`](https://github.com/google/yapf). One can e.g., do `$VENV/bin/yapf --style=linters/yapf -i -r ctaGuiFront/ctaGuiFront/py/`, etc. The rules are defined in `linters/yapf`.
- The JavaScript code complies with the [`eslint`](https://eslint.org/). One can e.g., do `eslint --c linters/eslintrc.json --fix ctaGuiFront/ctaGuiFront/js/widgets/EmptyExample.js`. The rules are defined in `linters/eslintrc.json`.

<!-- 
cd ctaOperatorGUI/ctaOperatorGUI/ctaGuiFront/ctaGuiFront
eslint --c ../../linters/eslintrc.json --fix js/utils/*js js/utils/*/*js js/widgets/*js
$VENV/bin/yapf --style=../../linters/yapf -i -r ./ ../../ctaGuiBack/ctaGuiBack/ ../../ctaGuiUtils/
-->

### Credits

- The SVG icons used to identify widgets were made by [Freepik](https://www.freepik.com/) from [www.flaticon.com](https://www.flaticon.com/).


---

In case of bugs or feature requests, contact [Iftach Sadeh](mailto:iftach.sadeh@desy.de).



