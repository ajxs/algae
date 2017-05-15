BABEL=./node_modules/.bin/babel
BABEL_PRESET=--presets latest

ALGAE=./dist/algae.js
SRC_DIR=./src/
ALGAE_FILES=main.js
ALGAE_SRC=$(foreach d, $(ALGAE_FILES), $(SRC_DIR)$d)

.PHONY: all clean

all: $(ALGAE)

$(ALGAE): $(ALGAE_SRC)
	$(BABEL) $(ALGAE_SRC) $(BABEL_PRESET) --out-file $(ALGAE)

clean:
	rm -rf ./dist/*.js;

watch:
	while inotifywait -e close_write ${SRC_DIR}*; do make; done
