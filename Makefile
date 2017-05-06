.PHONY: all build check clean watch distclean which browserify

PATH := ./node_modules/.bin:$(PATH)

SRC=src/*.ts
TSC = ./node_modules/.bin/tsc
#TSCOPT = -d #-t ES5 --sourceMap --noImplicitAny --strictNullChecks
BIFY = ./node_modules/.bin/browserify
BOPT = -d -p [ tsify ] -o build/smallio-all.js src/smallio.ts
WIFY = ./node_modules/.bin/watchify
WOPT = --verbose $(BOPT)

all: browserify soundjs build/index.html build/gfx build/sfx build/music

.PHONY: soundjs
soundjs: build/soundjs-0.6.0.min.js
build/soundjs-0.6.0.min.js: build
	cd build && \
	wget http://code.createjs.com/soundjs-0.6.0.min.js

build: src/ionsible
	mkdir -p build

src/ionsible:
	ln -sf ../node_modules/ionsible/src src/ionsible

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

build/index.html: build
	cp -L src/index.html $@

watch: build $(SRC)
	$(WIFY) $(WOPT)

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

browserify: build/smallio-all.js
build/smallio-all.js: build src/smallio.ts $(SRC)
	$(BIFY) $(BOPT)

which:
	@which $(TSC)

