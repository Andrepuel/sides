all: liboi.so oi.js

liboi.so: oi.c ola_setter.c target/debug/libplayground.so
	gcc $^ -shared -o $@

target/debug/libplayground.so: src/lib.rs src/python.rs
	cargo build

oi.js: oi.ts
	node node_modules/.bin/tsc oi.ts

run: oi.js liboi.so
	LD_PRELOAD=/usr/lib/libpython3.8.so.1.0 node oi.js
