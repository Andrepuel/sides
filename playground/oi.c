struct Thing;
struct Vtable {
    void (*destroy)(struct Thing*);
    int (*number)(struct Thing*);
};

struct Thing {
    struct Vtable* vtable;
};

struct Thing* fromJs();
void sides_rust_main(struct Thing*);

#include <stdio.h>

void _sides_main() {
    struct Thing* a = fromJs();
    printf("C side %d\n", (*a->vtable->number)(a));
    sides_rust_main(a);
}