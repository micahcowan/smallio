.PHONY: all build check clean watch distclean which browserify

PATH := ./node_modules/.bin:$(PATH)

SRC=src/*.ts
TSC = ./node_modules/.bin/tsc
TSCOPT = -d #-t ES5 --sourceMap --noImplicitAny --strictNullChecks
BIFY = ./node_modules/.bin/browserify -d

all: browserify build/index.html #build/sounds

build: build/smallio.js
build/smallio.js: $(SRC)
	$(TSC) $(TSCOPT) --rootDir src --outDir build $^

build/index.html:
	ln -sf ../src/index.html $@
#build/sounds:
#	ln -sf ../sounds $@

watch: $(SRC)
	$(TSC) $(TSCOPT) -w --rootDir src --outDir build $^ || true

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

browserify: build/smallio-all.js
build/smallio-all.js: build/smallio.js
	$(BIFY) -o $@ $<

which:
	@which $(TSC)

