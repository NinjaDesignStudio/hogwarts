dice3d.js is built from src/dice3d.src.js (three 0.160.1 + cannon-es 0.20.0):

    npm i three@0.160.1 cannon-es@0.20.0 esbuild@0.24.0
    npx esbuild src/dice3d.src.js --bundle --minify --format=iife --target=es2019 --outfile=dice3d.js
