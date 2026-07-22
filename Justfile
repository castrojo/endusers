serve:
    npm run docus:start -- --host 0.0.0.0

import:
    npm run import:architectures
    npm run validate:architectures

build:
    npm run validate:architectures
    npm run build
