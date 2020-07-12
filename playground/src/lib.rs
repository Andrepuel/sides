mod python;

#[repr(C)]
struct ThingVtable<T: 'static> {
    destroy: extern fn(side_self: *mut T) -> (),
    number: extern fn(sides_self: *mut T) -> i32,
}

pub trait Thing {
    fn number(&mut self) -> i32;
}

pub struct ThingInstance<T: Thing + 'static> {
    vtable: &'static ThingVtable<ThingInstance<T>>,
    sides_self: T,
}
impl<T: Thing> ThingInstance<T> {
    extern "C" fn vtable_destroy(sides_self: *mut ThingInstance<T>) -> () {
        unsafe { Box::from_raw(sides_self) };
    }
    extern "C" fn vtable_number(sides_self: *mut ThingInstance<T>) -> i32 {
        unsafe { (*sides_self).sides_self.number() }
    }

    fn new(sides_self: T) -> ThingInstance<T> {
        let vtable = Box::into_raw(Box::new(ThingVtable {
            destroy: ThingInstance::<T>::vtable_destroy,
            number: ThingInstance::<T>::vtable_number,
        }));

        ThingInstance {
            vtable: unsafe { &(*vtable) },
            sides_self,
        }
    }
}

pub struct ThingImpl {
}
impl Thing for ThingImpl {
    fn number(&mut self) -> i32 {
        42
    }
}
impl Drop for ThingImpl {
    fn drop(&mut self) {
        eprintln!("GOING AWAY!");
    }
}

pub struct ThingExternal {
    vtable: &'static ThingVtable<ThingExternal>,
}
impl Thing for ThingExternal {
    fn number(&mut self) -> i32 {
        (self.vtable.number)(self as *mut ThingExternal)
    }
}
impl Drop for ThingExternal {
    fn drop(&mut self) {
        (self.vtable.destroy)(self as *mut ThingExternal)
    }
}

// #[no_mangle]
// pub extern "C" fn fromRust() -> Box<ThingInstance<ThingImpl>> {
//     Box::new(ThingInstance::new(ThingImpl {}))
// }

#[no_mangle]
pub extern "C" fn sides_rust_main(mut thing: Box<ThingExternal>) {
    println!("Got into rust {}", thing.number());
    println!("Vtable {:?}", thing.vtable as *const ThingVtable<ThingExternal>);
    if let Err(e) = python::run_python(thing) {
        eprintln!("error {:?}", e);
    }
}