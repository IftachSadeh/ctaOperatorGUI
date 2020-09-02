# ctaOperatorGUI v1.0.0

## Overview

The human machine interface (HMI) for the operator the Cherenkov Telescope Array (CTA) [https://www.cta-observatory.org/](https://www.cta-observatory.org/).

For additional information, see:
  - Prototyping the graphical user interface for the operator of the Cherenkov Telescope Array, [arXiv:1608.03595](https://arxiv.org/abs/1608.03595).
  - The Graphical User Interface of the Operator of the Cherenkov Telescope Array, [arXiv:1710.07117](https://arxiv.org/abs/1710.07117).
  - [This talk](https://youtu.be/8ZvUj-DHSgE?list=PLSmiVc92qFFJG0kPQtYK0Y33fj00rcVkL), given at the ICALEPCS 2017 conference.

## Installing and running the server

### Dependencies 

- The package is based on several open source projects:
  - [Pyramid](http://docs.pylonsproject.org/projects/pyramid/en/latest/index.html) is used as a python web server.
  - Visualizations are performed using the [d3.js](https://d3js.org/) JavaScript library.
  - The package uses the [`redis`](https://redis.io/) database.

  Additionally, `data_manager` implements an interface to the ALMA Common Software (ACS). However, ACS is not required in order to run the package.

- Development is being done using `python v3.6.9` and `d3.js v4.1`.

### First-time setup

- Define some environment variables:
  ```bash
    export hmiBaseDir="<absolute-path-to-install-dir>"
    export VENV="$hmiBaseDir/venv"
    export pythonPathAdd="$hmiBaseDir:$hmiBaseDir/utils/:$hmiBaseDir/data_manager/:$hmiBaseDir/frontend_manager/frontend_manager/py/:"
    export PYTHONPATH="$pythonPathAdd$PYTHONPATH"
  ```
    - Modify `absolute-path-to-install-dir` to be the top directory of the package.
    - These variables should be defined before the package is run in a new session.

- Create a `virtualenv` and install dependencies:
  ```bash
    cd $ctaBaseDir
    python -m venv $VENV
    $VENV/bin/pip install -e .
  ```
  optionally, also install dependencies for linting and documentation (requires the Node package manager):
  ```bash
    npm install -g eslint
    npm install -g jsdoc
  ```

### Running the package


- Run the two service managers in two terminal sessions:
  ```bash
    cd $hmiBaseDir/data_manager/
    $VENV/bin/python run_server.py --site_type=N
  ```

  ```bash  
    cd $hmiBaseDir/frontend_manager/
    $VENV/bin/python run_server.py --site_type=N
  ```
  or use `--site_type=S` for the Southern site. Additional arguments are defined in `shared/server_args.py`.

- `redis` must be running on port `8091` for the North site, and `8096` for the South (configurable as command-line arguments, e.g., `--redis_port=8097`).

- View the client in a web browser, by navigating to `http://localhost:8090/cta/index` for the North, or with default port `8095` for the South (configurable with `--app_port`).

## Adding a new widget in a new view

The following details the minimal procedure to add a new widget, `TestExample`, bootstrapped from the `EmptyExample` widget. In this example, the new widget will be added to a new view, called `TestView`. In general, any widget may be added to an existing view (i.e., skip steps 3-4 below, to avoid creating a dedicated view).

- Create a copy of the `EmptyExample` JavaScript/python files with the new widget name. Notice that we need to replace the the listed permutations of capitalisation in different places:
  ```bash
  cd frontend_manager
  sed "s/EmptyExample/TestExample/g" js/widgets/EmptyExample.js | sed "s/empty_example/test_example/g" > js/widgets/TestExample.js
  sed "s/EmptyExample/TestExample/g" py/widgets/EmptyExample.py | sed "s/empty_example/test_example/g" > py/widgets/TestExample.py
  ```
    It is important to keep the naming scheme consistent (including capitalisation), and to make sure that the `main_script_tag` variable in `js/widgets/TestExample.js` is set to the exact widget name.

- Make the following modifications:
  1. In `shared/server_args.py`: add the new widget (`TestExample`) to `allowed_widget_types`. This is used to make sure that a dynamically added widget-class (i.e., `frontend_manager/py/widgets/TestExample.py`) is valid.
  Add the new view (`myNewView`) to `widget_info`. This lets the server know that the new URL (`http://localhost:8090/cta/myNewView`) is valid.
  3. In `frontend_manager/js/utils/setup_view.js`: add the new view and the new widget to `setup_view` (copy the entry for `TestExample`). Here the widgets which are loaded in a given view are defined. The new widget may also be added to an existing view.
  4. In `frontend_manager/js/utils/BaseApp.js`: add the new view (`myNewView`) to the `add_site_nav_menu` function  (copy the entry for `TestExample`). This will add an entry to the new view in the main navigation menu in the index page and in side-menu.


## Comments

### General

- If running the server on a remote machine, one may connect using an ssh tunnel. From the local machine, run
  ```bash
  ssh MyUserName@myServer -L8092:localhost:8090
  ```
  then, for this example, navigate to `http://127.0.0.1:8092/cta`.

### Authentication

The HMI uses local definitions for user-names and passwords, which are defined in `frontend_manager/py/utils/security.py`. This is a very simplistic method for authentication for development purposes - one can add `ssl` support to the `gunicorn` server, but this is not recommended. This procedure should be replaced or supplemented with a reverse-proxy server for production. For example, choosing `apache` as the reverse-proxy, one may use the following `httpd.conf` configuration directives:
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

  #######  ProxyPass        /socket.io http://localhost:${appPort}/socket.io
  #######  ProxyPassReverse /socket.io http://localhost:${appPort}/socket.io

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
  #######  RewriteCond %{REQUEST_URI}  ^/socket.io/1/websocket  [NC]
  #######  RewriteRule /(.*)           ws://localhost:${appPort}/$1 [P,L]

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

*TODO: define anew the lines marked with #######, according to the new setup, where the address is defined as part of `websocket_route` in `frontend_manager/py/utils/server_setup.py`.*

### Styling conventions

- The python code complies with `pep8`/[`yapf`](https://github.com/google/yapf). One can e.g., do `$VENV/bin/yapf --style=linters/yapf -i -r frontend_manager/py/`, etc. The rules are defined in `linters/yapf`.
- The JavaScript code complies with the [`eslint`](https://eslint.org/). One can e.g., do `eslint --c linters/eslintrc.json --fix frontend_manager/js/widgets/EmptyExample.js`. The rules are defined in `linters/eslintrc.json`.

### Documentation

- Buildthe documentation with:
  ```bash
  cd docs/
  make html
  ```
  which is then available at `docs/build/html/index.html`.

### Credits

- The SVG icons used to identify widgets were made by [Freepik](https://www.freepik.com/) from [www.flaticon.com](https://www.flaticon.com/).


