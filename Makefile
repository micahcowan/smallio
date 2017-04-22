.PHONY: all build check clean watch distclean which browserify

PATH := ./node_modules/.bin:$(PATH)

SRC=src/*.ts
TSC = ./node_modules/.bin/tsc
#TSCOPT = -d #-t ES5 --sourceMap --noImplicitAny --strictNullChecks
BIFY = ./node_modules/.bin/browserify -d -p [ tsify ]

all: browserify build/index.html #build/sounds

build: build/smallio.js
build/smallio.js: $(SRC)
	$(TSC)

build/index.html:
	ln -sf ../src/index.html $@
#build/sounds:
#	ln -sf ../sounds $@

watch: $(SRC)
	$(TSC) -w

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

browserify: build/smallio-all.js
build/smallio-all.js: src/smallio.ts #build/smallio.js
	mkdir -p build
	$(BIFY) -o $@ $<

which:
	@which $(TSC)

