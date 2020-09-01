#!/bin/bash
# ------------------------------------------------------------------

# javascript
eslint --c ./linters/eslintrc.json --fix ctaGuiFront/ctaGuiFront/js/utils/*js
eslint --c ./linters/eslintrc.json --fix ctaGuiFront/ctaGuiFront/js/utils/*/*js
eslint --c ./linters/eslintrc.json --fix ctaGuiFront/ctaGuiFront/js/widgets/*js

# python
$VENV/bin/yapf --style=./linters/yapf -i -r ctaGuiFront/*.py ctaGuiFront/ctaGuiFront/__init__.py ctaGuiFront/ctaGuiFront/py/ ctaGuiFront/ctaGuiFront/scripts/
$VENV/bin/yapf --style=./linters/yapf -i -r ctaGuiBack/*.py ctaGuiBack/ctaGuiBack/__init__.py ctaGuiBack/ctaGuiBack/py/ ctaGuiBack/ctaGuiBack/acs/
$VENV/bin/yapf --style=./linters/yapf -i -r ctaGuiUtils/py/
