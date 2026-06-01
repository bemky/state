/**
   @class State 
*/
export default class State {
    #value = null;
    listens = new Set

    /**
        Denotes this object is a State, helpful for telling objects apart
        @property {boolean} isState -
    */
    isState = true

    static isState (obj) {
        return obj instanceof this
    }

    /**
        When a `transform` spawn is garbage-collected, drop the now-dead
        listener it left on its source State. The source holds the spawn only
        through a WeakRef (see `transform`), so the spawn stays collectable; this
        registry prunes the leftover listener once that collection happens.
    */
    static transformRegistry = new FinalizationRegistry(({ source, callback }) => {
        source.removeListener(callback)
    })
    
    constructor(v) {
        this.#value = v
    }
    valueOf () {
        return this.#value
    }
    
    /**
        The root value of the state
        @property {*} value - can be any type or object
    */
    get value () {
        return this.#value
    }
    set value (v) {
        return this.set(v)
    }
    
    /**
        Set the root value of the State
        @instance
        @param {*} newValue - the new value of the state; can be any type or object
        @param {*} metadata - any type or object to include as argument when calling listening callbacks
        @returns {this}
    */
    set (newValue, metadata) {
        const oldValue = this.#value
        if (oldValue != newValue) {
            this.#value = newValue
            this.dispatch(newValue, oldValue, metadata)
        }
        return this
    }
    /**
        Call all listening callbacks
        @instance
        @private
        @param {*} newValue - the new value of the state; can be any type or object
        @param {*} oldValue - the old value of the state; can be any type or object
        @param {*} metadata - any type or object to include as argument when calling listening callbacks
        @returns {this}
    */
    dispatch (newValue, oldValue, metadata) {
        if (newValue === undefined) newValue = this.#value
        this.listens.forEach(callback => {
            callback(newValue, oldValue, metadata)
        })
        return this
    }
    
    /**
        @callback changeCallback
        @param {*} newValue - the new value of the state; can be any type or object
        @param {*} oldValue - the old value of the state; can be any type or object
        @param {*} metadata - any type or object that was included as argument when setting new value
    */
    
    /**
        Add a callback to be called when value changes
        @instance
        @param {changeCallback} changeCallback - function to call when value changes
        @returns {this}
    */
    addListener (changeCallback) {
        this.listens.add(changeCallback)
        return this
    }
    
    /**
        Remove a callback to be called when value changes
        @instance
        @param {changeCallback} changeCallback - function to call when value changes
        @returns {this}
    */
    removeListener (changeCallback) {
        this.listens.delete(changeCallback)
        return this
    }
    
    removeAllListeners () {
        this.listens.clear()
        return this
    }
    
    /**
        @callback transformation
        @param {*} newValue - the new value of the state; can be any type or object
        @param {*} oldValue - the old value of the state; can be any type or object
        @param {*} metadata - any type or object that was included as argument when setting new value
        @returns {*} value to be set as spawns value
    */
    /**
        Spawns a new State who's value is tied to this state with the given tranformation
        @instance
        @param {transformation} changeCallback - function to call when value changes
        @returns {State}
    */
    transform (transformation) {
        const spawn = new State(transformation(this.#value))
        const source = this
        // The source must hold the spawn WEAKLY. A strong reference here would
        // pin every spawn for the source's entire lifetime — and sources are
        // often long-lived (e.g. a memoized `record.state(attr)`), so each
        // render would leak another spawn + listener. Instead the listener
        // dereferences a WeakRef; once the spawn is collected the listener is
        // a no-op and `transformRegistry` removes it from the source.
        const spawnRef = new WeakRef(spawn)
        const callback = (...args) => {
            const target = spawnRef.deref()
            if (target === undefined) {
                source.removeListener(callback)
            } else {
                target.set(transformation(...args))
            }
        }
        this.addListener(callback)
        State.transformRegistry.register(spawn, { source, callback })
        return spawn
    }
}