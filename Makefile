.PHONY: all build check clean watch distclean which browserify

PATH := ./node_modules/.bin:$(PATH)

SRC=src/*.ts
TSC = ./node_modules/.bin/tsc
#TSCOPT = -d #-t ES5 --sourceMap --noImplicitAny --strictNullChecks
BIFY = ./node_modules/.bin/browserify -d -p [ tsify ]

all: browserify build/index.html build/gfx build/sfx build/music

build: build/smallio.js
build/smallio.js: $(SRC)
	$(TSC)

build/gfx: gfx/*.png
	mkdir -p build/gfx
	cp -L gfx/*.png build/gfx

build/sfx: sfx/*.mp3
	mkdir -p build/sfx
	cp -L $^ $@/

build/music: music/*.mp3
	mkdir -p $@
	cp -L $^ $@/

build/index.html:
	cp -L src/index.html $@

watch: $(SRC)
	$(TSC) -w

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

browserify: build/smallio-all.js
build/smallio-all.js: src/smallio.ts $(SRC)
	mkdir -p build
	$(BIFY) -o $@ src/smallio.ts

which:
	@which $(TSC)

