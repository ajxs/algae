BABEL=./node_modules/.bin/babel
BABEL_PRESET=--presets latest
BABEL_ARGS=--source-maps

ALGAE=./dist/algae.js
SRC_DIR=./src/
ALGAE_FILES=core.js parse.js
ALGAE_SRC=$(foreach d, ${ALGAE_FILES}, ${SRC_DIR}$d)

.PHONY: all clean

all: $(ALGAE)

${ALGAE}: ${ALGAE_SRC}
	${BABEL} ${ALGAE_SRC} ${BABEL_PRESET} --out-file ${ALGAE} ${BABEL_ARGS}

clean:
	rm -rf ./dist/*.js;

watch:
	while inotifywait -e close_write ${SRC_DIR}*; do make; done
