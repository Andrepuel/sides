import ctypes

def offset(void, off):
    out = ctypes.c_void_p(void.value + off)
    return out

class ThingVtable:
    def __init__(self, sides_self):
        self.vtable = ctypes.cast(sides_self, ctypes.POINTER(ctypes.c_void_p)).contents
        print(self.vtable)

    def nomore(self, sides_self):
        ctypes.cast(
            offset(self.vtable, 0),
            ctypes.POINTER(ctypes.CFUNCTYPE(None, ctypes.c_void_p))
        ).contents(sides_self)

    def number(self, sides_self):
        func = ctypes.cast(
            offset(self.vtable, 8),
            ctypes.POINTER(ctypes.CFUNCTYPE(ctypes.c_int32, ctypes.c_void_p))
        ).contents
        return func(sides_self)

class ThingExternal:
    def __init__(self, sides_self):
        self.sides_self = sides_self
        self.vtable = ThingVtable(sides_self)

    def nomore(self):
        self.vtable.nomore(self.sides_self)

    def number(self):
        return self.vtable.number(self.sides_self)

def main(thing):
    print(thing)
    thing = ThingExternal(thing)
    print("Number is ", thing.number())
    thing.nomore()