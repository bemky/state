import State from '../state.js';
import { Record } from 'viking';

Record.prototype.state = function (attribute) {
    if (!this.states) this.states = {};
    if (!this.states[attribute]) {
        const association = this.association(attribute);
        if (association) {
            // Collection associations mutate `target` in place, so passing it straight
            // through leaves State comparing an array against itself and no listener
            // ever fires. Snapshot those; belongsTo hands over the record as-is.
            const read = () => Array.isArray(association.target) ? [...association.target] : association.target;
            this.states[attribute] = new State(read());
            association.addEventListener(['afterAdd', 'afterRemove'], () => {
                this.states[attribute].set(read());
            });
        } else {
            this.states[attribute] = new State(this[attribute]);
            this.addEventListener('changed:' + attribute, (record, was, now) => {
                this.states[attribute].set(now);
            });
        }
    }
    return this.states[attribute];
}
