use crate::ThingExternal;

use pyo3::prelude::*;
use pyo3::types::IntoPyDict;

use std::ops::Deref;

pub fn run_python(thing: Box<ThingExternal>) -> Result<(), ()> {
    let gil = Python::acquire_gil();
    let py = gil.python();
    main_(py, thing).map_err(|e| {
        // We can't display Python exceptions via std::fmt::Display,
        // so print the error here manually.
        e.print_and_set_sys_last_vars(py);
    })
}

fn main_(py: Python, mut thing: Box<ThingExternal>) -> PyResult<()> {
    let ctypes = py.import("ctypes")?;
    let thing = ctypes.get("c_void_p")?.call1((Box::into_raw(thing) as u64,))?;

    let main = PyModule::from_code(py, &std::fs::read_to_string("main.py")?, "main.py", "main")?.deref();

    let locals = [("main", main), ("thing", thing)].into_py_dict(py);
    println!("python main: {:?}", py.eval("main.main(thing)", None, Some(&locals))?);
    Ok(())
}