import State from '../state.js';
import { Model, Record } from 'viking';

Model.prototype.state = function (attribute) {
    if (!this.states) this.states = {};
    if (!this.states[attribute]) {
        this.states[attribute] = new State(this[attribute]);
        this.addEventListener('changed:' + attribute, (record, was, now) => {
            this.states[attribute].set(now);
        });
    }
    return this.states[attribute];
}

Record.prototype.state = function (attribute) {
    if (!this.states) this.states = {};
    if (!this.states[attribute]) {
        if (this.association(attribute)) {
            this.states[attribute] = new State(this.association(attribute).target);
            this.association(attribute).addEventListener(['afterAdd', 'afterRemove'], (changed) => {
                this.states[attribute].set(this.association(attribute).target);
            });
        } else {
            return Model.prototype.state.call(this, attribute);
        }
    }
    return this.states[attribute];
}
