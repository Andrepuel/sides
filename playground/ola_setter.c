struct Thing;

static struct Thing* (*_fromJs)();
void sides_set_fromJs(struct Thing* (*fromJs)()) {
    _fromJs = fromJs;
}

struct Thing* fromJs() {
    return (*_fromJs)();
}