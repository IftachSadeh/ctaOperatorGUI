#!/bin/bash
# ------------------------------------------------------------------

# javascript
eslint --c ./linters/eslintrc.json --fix frontend_manager/js/utils/*js
eslint --c ./linters/eslintrc.json --fix frontend_manager/js/utils/*/*js
eslint --c ./linters/eslintrc.json --fix frontend_manager/js/widgets/*js

# python
$VENV/bin/yapf --style=./linters/yapf -i -r frontend_manager/ data_manager/ shared/
