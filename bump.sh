#!/bin/sh
# Gives css/js links a new ?v= so browsers fetch the fresh files right after a push
# (GitHub Pages otherwise lets browsers keep the old ones for 10 minutes).
v=$(date +%Y%m%d%H%M%S)
sed -i.bak -E "s#(css/style\.css|js/data\.js|js/main\.js)(\?v=[0-9]+)?\"#\1?v=$v\"#g" index.html && rm -f index.html.bak
echo "version $v"
