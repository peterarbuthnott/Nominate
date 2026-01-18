
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Player {
        constructor(name, isDealer) {
            this._currentScore = 0;
            this._madeBids = 0;
            this._isDealer = false;
            this._playerRoundScores = [];
            this._name = "unknown player";
            this._name = name;
            this._isDealer = isDealer;
            for (let rounds = 0; rounds <= 18; rounds++) {
                this._playerRoundScores.push(new PlayerRoundScore());
            }
        }
        get name() {
            return this._name;
        }
        set name(value) {
            this._name = value;
        }
        getCurrentScore() {
            return this._currentScore;
        }
        getMadeBids() {
            return this._madeBids;
        }
    }
    class PlayerRoundScore {
        constructor() {
            this._tricksNominated = 0;
            this._tricksWon = 0;
            this._score = 0;
            this._madeBid = false;
        }
    }

    class Game {
        constructor() {
            this._rounds = [];
            this._currentRound = 1;
            this._numberOfPlayers = 2;
            this._players = [];
            // // set up rounds
            for (let rounds = 0; rounds < 18; rounds++) {
                this._rounds.push(new Round(rounds + 1));
            }
        }
        setNumberOfPlayers(numberOfPlayers) {
            this._numberOfPlayers = numberOfPlayers;
            // set up players
            this._players = [];
            this._players.push(new Player('1', true));
            for (let players = 2; players <= numberOfPlayers; players++) {
                this._players.push(new Player(players.toLocaleString(), false));
            }
        }
        moveDealerOn() {
            for (let player = 0; player <= this._numberOfPlayers; player++) {
                if (this._players[player]._isDealer) {
                    console.log("current dealer = " + this._players[player]._name);
                    this._players[player]._isDealer = false;
                    if (player === this._numberOfPlayers - 1) {
                        this._players[0]._isDealer = true;
                        console.log("new dealer = " + this._players[0]._name);
                    }
                    else {
                        this._players[player + 1]._isDealer = true;
                        console.log("new dealer = " + this._players[player + 1]._name);
                    }
                    break;
                }
            }
        }
        renderNominated(table) {
            let headerRow = table.insertRow().insertCell();
            headerRow.colSpan = this._numberOfPlayers;
            headerRow.textContent = this.renderGameResults();
            for (let row = 0; row < this._rounds.length; row++) {
                let rowData = table.insertRow();
                for (let col = 0; col < this._numberOfPlayers; col++) {
                    let colData = rowData.insertCell();
                    colData.textContent = "x" + col + row + "y"; // this._players[row].Player; //.[col];
                }
            }
        }
        renderGameResults() {
            return "round:" + this._currentRound + " total players = " + this._players.length;
        }
    }
    class Round {
        constructor(roundNumber) {
            this._roundNumber = 0;
            this._trumpSuit = "no";
            this._trumpSuits = ["clubs ♣", "diamonds ♦", "hearts ♥", "spades ♠"];
            this._isRedSuit = false;
            this._redSuits = [false, true, true, false];
            this._tricks = 0;
            this._isMiss = false;
            this._isBlind = false;
            this._roundNumber = roundNumber;
            if (this._roundNumber <= 7) {
                this._tricks = roundNumber;
                this._trumpSuit = this._trumpSuits[(roundNumber < 5 ? roundNumber - 1 : roundNumber - 5)];
                this._isRedSuit = this._redSuits[(roundNumber < 5 ? roundNumber - 1 : roundNumber - 5)];
            }
            else if (this._roundNumber > 7 && this._roundNumber < 12) {
                if (this._roundNumber == 8 || this._roundNumber == 10) {
                    this._trumpSuit = this._trumpSuits[(roundNumber < 9 ? roundNumber - 5 : roundNumber - 10)];
                    this._isRedSuit = this._redSuits[(roundNumber < 9 ? roundNumber - 5 : roundNumber - 10)];
                }
                if (this._roundNumber > 9) {
                    this._isBlind = true;
                }
                this._isMiss = true;
                this._tricks = 0;
            }
            else {
                this._tricks = (19 - this._roundNumber);
                this._isBlind = false;
                this._trumpSuit = this._trumpSuits[(roundNumber < 15 ? roundNumber - 11 : roundNumber - 15)];
                this._isRedSuit = this._redSuits[(roundNumber < 15 ? roundNumber - 11 : roundNumber - 15)];
            }
        }
        get roundNumber() {
            return this._roundNumber;
        }
        get isBlind() {
            return this._isBlind;
        }
        get isMiss() {
            return this._isMiss;
        }
        get tricks() {
            return this._tricks;
        }
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[26] = list;
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[28] = list;
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[36] = list;
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (92:4) {#if gameState === 0}
    function create_if_block_10(ctx) {
    	let h2;
    	let t1;
    	let select;
    	let option;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value_8 = Array(6);
    	validate_each_argument(each_value_8);
    	const get_key = ctx => /*index*/ ctx[32];
    	validate_each_keys(ctx, each_value_8, get_each_context_8, get_key);

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		let child_ctx = get_each_context_8(ctx, each_value_8, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_8(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "How many players?";
    			t1 = space();
    			select = element("select");
    			option = element("option");
    			option.textContent = "Pick one!";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file, 92, 8, 3584);
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file, 94, 12, 3725);
    			if (/*numberOfPlayers*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[11].call(select));
    			add_location(select, file, 93, 8, 3619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*numberOfPlayers*/ ctx[2]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[11]),
    					listen_dev(select, "change", /*change_handler*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array*/ 0) {
    				each_value_8 = Array(6);
    				validate_each_argument(each_value_8);
    				validate_each_keys(ctx, each_value_8, get_each_context_8, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_8, each_1_lookup, select, destroy_block, create_each_block_8, null, get_each_context_8);
    			}

    			if (dirty[0] & /*numberOfPlayers*/ 4) {
    				select_option(select, /*numberOfPlayers*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(92:4) {#if gameState === 0}",
    		ctx
    	});

    	return block;
    }

    // (96:12) {#each Array(6) as _, index (index)}
    function create_each_block_8(key_1, ctx) {
    	let option;
    	let t_value = /*index*/ ctx[32] + 2 + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*index*/ ctx[32] + 2;
    			option.value = option.__value;
    			add_location(option, file, 96, 16, 3826);
    			this.first = option;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(96:12) {#each Array(6) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#if gameState === 1}
    function create_if_block_9(ctx) {
    	let h2;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_7 = /*theGame*/ ctx[1]._players;
    	validate_each_argument(each_value_7);
    	const get_key = ctx => /*index*/ ctx[32];
    	validate_each_keys(ctx, each_value_7, get_each_context_7, get_key);

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		let child_ctx = get_each_context_7(ctx, each_value_7, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_7(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Names them players!";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Done Naming >>";
    			add_location(h2, file, 101, 8, 3953);
    			attr_dev(button, "class", "svelte-1sqv3z7");
    			add_location(button, file, 106, 8, 4220);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame, nameThisPlayer*/ 66) {
    				each_value_7 = /*theGame*/ ctx[1]._players;
    				validate_each_argument(each_value_7);
    				validate_each_keys(ctx, each_value_7, get_each_context_7, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_7, each_1_lookup, t2.parentNode, destroy_block, create_each_block_7, t2, get_each_context_7);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(101:4) {#if gameState === 1}",
    		ctx
    	});

    	return block;
    }

    // (103:8) {#each theGame._players as p, index(index)}
    function create_each_block_7(key_1, ctx) {
    	let t0;
    	let t1_value = /*index*/ ctx[32] + 1 + "";
    	let t1;
    	let t2;
    	let input;
    	let br;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[13].call(input, /*each_value_7*/ ctx[36], /*index*/ ctx[32]);
    	}

    	function change_handler_1() {
    		return /*change_handler_1*/ ctx[14](/*index*/ ctx[32], /*p*/ ctx[20]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			t0 = text("Player ");
    			t1 = text(t1_value);
    			t2 = space();
    			input = element("input");
    			br = element("br");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 103, 31, 4065);
    			add_location(br, file, 104, 86, 4190);
    			this.first = t0;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*p*/ ctx[20].name);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler),
    					listen_dev(input, "change", change_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*theGame*/ 2 && t1_value !== (t1_value = /*index*/ ctx[32] + 1 + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*theGame*/ 2 && input.value !== /*p*/ ctx[20].name) {
    				set_input_value(input, /*p*/ ctx[20].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(103:8) {#each theGame._players as p, index(index)}",
    		ctx
    	});

    	return block;
    }

    // (109:4) {#if gameState === 2}
    function create_if_block_1(ctx) {
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let th3;
    	let t9;
    	let th4;
    	let t11;
    	let t12;
    	let th5;
    	let t14;
    	let tbody;
    	let t15;
    	let tfoot;
    	let tr1;
    	let td0;
    	let t17;
    	let t18;
    	let td1;
    	let each_value_6 = /*theGame*/ ctx[1]._players;
    	validate_each_argument(each_value_6);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_2[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_2 = /*theGame*/ ctx[1]._rounds;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*theGame*/ ctx[1]._players;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Scoring!";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "round";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = " ";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = " ";
    			t7 = space();
    			th3 = element("th");
    			th3.textContent = "trumps";
    			t9 = space();
    			th4 = element("th");
    			th4.textContent = "tricks";
    			t11 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t12 = space();
    			th5 = element("th");
    			th5.textContent = "Actions ...";
    			t14 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			tfoot = element("tfoot");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Score";
    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			td1 = element("td");
    			td1.textContent = " ";
    			add_location(h2, file, 109, 8, 4334);
    			add_location(th0, file, 113, 16, 4421);
    			add_location(th1, file, 114, 16, 4452);
    			add_location(th2, file, 115, 16, 4484);
    			add_location(th3, file, 116, 16, 4516);
    			add_location(th4, file, 117, 16, 4548);
    			add_location(th5, file, 121, 16, 4700);
    			add_location(tr0, file, 112, 12, 4400);
    			add_location(thead, file, 111, 12, 4380);
    			add_location(tbody, file, 124, 12, 4772);
    			attr_dev(td0, "colspan", "5");
    			attr_dev(td0, "class", "totes svelte-1sqv3z7");
    			add_location(td0, file, 186, 16, 8477);
    			attr_dev(td1, "class", "svelte-1sqv3z7");
    			add_location(td1, file, 191, 16, 8782);
    			add_location(tr1, file, 185, 12, 8456);
    			add_location(tfoot, file, 184, 12, 8436);
    			attr_dev(table, "class", "svelte-1sqv3z7");
    			add_location(table, file, 110, 8, 4360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t5);
    			append_dev(tr0, th2);
    			append_dev(tr0, t7);
    			append_dev(tr0, th3);
    			append_dev(tr0, t9);
    			append_dev(tr0, th4);
    			append_dev(tr0, t11);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tr0, null);
    			}

    			append_dev(tr0, t12);
    			append_dev(tr0, th5);
    			append_dev(table, t14);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody, null);
    			}

    			append_dev(table, t15);
    			append_dev(table, tfoot);
    			append_dev(tfoot, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr1, null);
    			}

    			append_dev(tr1, t18);
    			append_dev(tr1, td1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2) {
    				each_value_6 = /*theGame*/ ctx[1]._players;
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_6(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tr0, t12);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_6.length;
    			}

    			if (dirty[0] & /*isCurrentRound, theGame, biddingIsDone, roundState, trickingIsDone*/ 1810) {
    				each_value_2 = /*theGame*/ ctx[1]._rounds;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				each_value_1 = /*theGame*/ ctx[1]._players;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr1, t18);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(109:4) {#if gameState === 2}",
    		ctx
    	});

    	return block;
    }

    // (119:16) {#each theGame._players as p}
    function create_each_block_6(ctx) {
    	let td;
    	let t_value = /*p*/ ctx[20].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "colspan", "3");
    			attr_dev(td, "class", "svelte-1sqv3z7");
    			add_location(td, file, 119, 20, 4630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2 && t_value !== (t_value = /*p*/ ctx[20].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(119:16) {#each theGame._players as p}",
    		ctx
    	});

    	return block;
    }

    // (164:24) {:else}
    function create_else_block_1(ctx) {
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			td0.textContent = "bid";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "got";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "score";
    			attr_dev(td0, "class", "results svelte-1sqv3z7");
    			add_location(td0, file, 164, 28, 7581);
    			attr_dev(td1, "class", "results svelte-1sqv3z7");
    			add_location(td1, file, 165, 28, 7638);
    			attr_dev(td2, "class", "results svelte-1sqv3z7");
    			add_location(td2, file, 166, 28, 7695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(164:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (141:64) 
    function create_if_block_6(ctx) {
    	let t0;
    	let td;

    	function select_block_type_1(ctx, dirty) {
    		if (/*roundState*/ ctx[4] === 0) return create_if_block_7;
    		if (/*roundState*/ ctx[4] === 1) return create_if_block_8;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			td = element("td");
    			td.textContent = "score";
    			attr_dev(td, "class", "results svelte-1sqv3z7");
    			add_location(td, file, 162, 28, 7490);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, td, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(141:64) ",
    		ctx
    	});

    	return block;
    }

    // (135:24) {#if r.roundNumber < theGame._currentRound}
    function create_if_block_5(ctx) {
    	let td0;
    	let t0_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksWon + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._score + "";
    	let t4;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			attr_dev(td0, "class", "edge entered svelte-1sqv3z7");
    			attr_dev(td0, "title", "bid");
    			add_location(td0, file, 135, 28, 5417);
    			attr_dev(td1, "class", "edge entered svelte-1sqv3z7");
    			attr_dev(td1, "title", "got");
    			add_location(td1, file, 137, 28, 5574);
    			attr_dev(td2, "class", "edge entered svelte-1sqv3z7");
    			attr_dev(td2, "title", "score");
    			toggle_class(td2, "madeBid", /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._madeBid);
    			add_location(td2, file, 138, 28, 5693);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td2, anchor);
    			append_dev(td2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2 && t0_value !== (t0_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*theGame*/ 2 && t2_value !== (t2_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksWon + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*theGame*/ 2 && t4_value !== (t4_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._score + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td2, "madeBid", /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._madeBid);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(135:24) {#if r.roundNumber < theGame._currentRound}",
    		ctx
    	});

    	return block;
    }

    // (152:55) 
    function create_if_block_8(ctx) {
    	let td0;
    	let t0_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated + "";
    	let t0;
    	let t1;
    	let td1;
    	let select;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value_5 = Array(/*r*/ ctx[25].isMiss ? 8 : /*r*/ ctx[25].tricks + 1);
    	validate_each_argument(each_value_5);
    	const get_key = ctx => /*index*/ ctx[32];
    	validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		let child_ctx = get_each_context_5(ctx, each_value_5, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
    	}

    	function select_change_handler_2() {
    		/*select_change_handler_2*/ ctx[17].call(select, /*r*/ ctx[25], /*each_value_3*/ ctx[28], /*p_index_2*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(td0, "class", "edge entered svelte-1sqv3z7");
    			attr_dev(td0, "title", "bid");
    			toggle_class(td0, "dealer", /*p*/ ctx[20]._isDealer);
    			add_location(td0, file, 152, 32, 6734);
    			attr_dev(select, "title", "got");
    			attr_dev(select, "class", "svelte-1sqv3z7");
    			if (/*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksWon === void 0) add_render_callback(select_change_handler_2);
    			add_location(select, file, 155, 36, 7027);
    			attr_dev(td1, "class", "edge results svelte-1sqv3z7");
    			attr_dev(td1, "title", "got");
    			toggle_class(td1, "dealer", /*p*/ ctx[20]._isDealer);
    			add_location(td1, file, 154, 32, 6926);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksWon);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", select_change_handler_2);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*theGame*/ 2 && t0_value !== (t0_value = /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td0, "dealer", /*p*/ ctx[20]._isDealer);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				each_value_5 = Array(/*r*/ ctx[25].isMiss ? 8 : /*r*/ ctx[25].tricks + 1);
    				validate_each_argument(each_value_5);
    				validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, select, destroy_block, create_each_block_5, null, get_each_context_5);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				select_option(select, /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksWon);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td1, "dealer", /*p*/ ctx[20]._isDealer);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(152:55) ",
    		ctx
    	});

    	return block;
    }

    // (142:28) {#if roundState === 0}
    function create_if_block_7(ctx) {
    	let td0;
    	let select;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let td1;
    	let mounted;
    	let dispose;
    	let each_value_4 = Array(/*r*/ ctx[25].tricks + 1);
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*index*/ ctx[32];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
    	}

    	function select_change_handler_1() {
    		/*select_change_handler_1*/ ctx[16].call(select, /*r*/ ctx[25], /*each_value_3*/ ctx[28], /*p_index_2*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			td1 = element("td");
    			td1.textContent = "got";
    			attr_dev(select, "title", "bid");
    			attr_dev(select, "class", "svelte-1sqv3z7");
    			if (/*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated === void 0) add_render_callback(select_change_handler_1);
    			add_location(select, file, 143, 36, 6124);
    			attr_dev(td0, "class", "edge results svelte-1sqv3z7");
    			attr_dev(td0, "title", "bid");
    			toggle_class(td0, "dealer", /*p*/ ctx[20]._isDealer);
    			add_location(td0, file, 142, 32, 6023);
    			attr_dev(td1, "class", "results svelte-1sqv3z7");
    			toggle_class(td1, "dealer", /*p*/ ctx[20]._isDealer);
    			add_location(td1, file, 150, 32, 6590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, td1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", select_change_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*theGame*/ 2) {
    				each_value_4 = Array(/*r*/ ctx[25].tricks + 1);
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, select, destroy_block, create_each_block_4, null, get_each_context_4);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				select_option(select, /*p*/ ctx[20]._playerRoundScores[/*r*/ ctx[25].roundNumber]._tricksNominated);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td0, "dealer", /*p*/ ctx[20]._isDealer);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td1, "dealer", /*p*/ ctx[20]._isDealer);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(td1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(142:28) {#if roundState === 0}",
    		ctx
    	});

    	return block;
    }

    // (157:40) {#each Array((r.isMiss ? 8 : r.tricks + 1)) as _, index (index)}
    function create_each_block_5(key_1, ctx) {
    	let option;
    	let t_value = /*index*/ ctx[32] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*index*/ ctx[32];
    			option.value = option.__value;
    			add_location(option, file, 157, 44, 7257);
    			this.first = option;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*theGame*/ 2 && t_value !== (t_value = /*index*/ ctx[32] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*theGame*/ 2 && option_value_value !== (option_value_value = /*index*/ ctx[32])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(157:40) {#each Array((r.isMiss ? 8 : r.tricks + 1)) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (146:40) {#each Array(r.tricks + 1) as _, index (index)}
    function create_each_block_4(key_1, ctx) {
    	let option;
    	let t_value = /*index*/ ctx[32] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*index*/ ctx[32];
    			option.value = option.__value;
    			add_location(option, file, 146, 44, 6387);
    			this.first = option;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*theGame*/ 2 && t_value !== (t_value = /*index*/ ctx[32] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*theGame*/ 2 && option_value_value !== (option_value_value = /*index*/ ctx[32])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(146:40) {#each Array(r.tricks + 1) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (134:20) {#each theGame._players as p}
    function create_each_block_3(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*theGame*/ 2) show_if = null;
    		if (/*r*/ ctx[25].roundNumber < /*theGame*/ ctx[1]._currentRound) return create_if_block_5;
    		if (show_if == null) show_if = !!/*isCurrentRound*/ ctx[8](/*r*/ ctx[25].roundNumber);
    		if (show_if) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx, [-1, -1]);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(134:20) {#each theGame._players as p}",
    		ctx
    	});

    	return block;
    }

    // (179:20) {:else}
    function create_else_block(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			td.textContent = " ";
    			attr_dev(td, "class", "svelte-1sqv3z7");
    			add_location(td, file, 179, 24, 8319);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(179:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (171:20) {#if isCurrentRound(r.roundNumber)}
    function create_if_block_2(ctx) {
    	let td;

    	function select_block_type_3(ctx, dirty) {
    		if (/*roundState*/ ctx[4] === 0) return create_if_block_3;
    		if (/*roundState*/ ctx[4] === 1) return create_if_block_4;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			if (if_block) if_block.c();
    			attr_dev(td, "class", "actions svelte-1sqv3z7");
    			add_location(td, file, 171, 24, 7865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if (if_block) if_block.m(td, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(td, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(171:20) {#if isCurrentRound(r.roundNumber)}",
    		ctx
    	});

    	return block;
    }

    // (175:55) 
    function create_if_block_4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Tricking Done >>";
    			attr_dev(button, "class", "svelte-1sqv3z7");
    			add_location(button, file, 175, 32, 8129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(175:55) ",
    		ctx
    	});

    	return block;
    }

    // (173:28) {#if roundState === 0}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Bidding Done >>";
    			attr_dev(button, "class", "svelte-1sqv3z7");
    			add_location(button, file, 173, 32, 7969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(173:28) {#if roundState === 0}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#each theGame._rounds as r}
    function create_each_block_2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*r*/ ctx[25].roundNumber + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = (/*r*/ ctx[25].isBlind ? "blind" : "") + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = (/*r*/ ctx[25].isMiss ? "miss" : "") + "";
    	let t4;
    	let t5;
    	let td3;

    	let t6_value = (/*r*/ ctx[25]._trumpSuit === "no"
    	? ""
    	: /*r*/ ctx[25]._trumpSuit) + "";

    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*r*/ ctx[25].tricks + "";
    	let t8;
    	let t9;
    	let t10;
    	let show_if;
    	let t11;
    	let each_value_3 = /*theGame*/ ctx[1]._players;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function select_block_type_2(ctx, dirty) {
    		if (dirty[0] & /*theGame*/ 2) show_if = null;
    		if (show_if == null) show_if = !!/*isCurrentRound*/ ctx[8](/*r*/ ctx[25].roundNumber);
    		if (show_if) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx, [-1, -1]);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			if_block.c();
    			t11 = space();
    			attr_dev(td0, "class", "svelte-1sqv3z7");
    			add_location(td0, file, 128, 20, 4980);
    			attr_dev(td1, "class", "svelte-1sqv3z7");
    			add_location(td1, file, 129, 20, 5025);
    			attr_dev(td2, "class", "svelte-1sqv3z7");
    			add_location(td2, file, 130, 20, 5081);
    			attr_dev(td3, "class", "totes svelte-1sqv3z7");
    			toggle_class(td3, "redSuit", /*r*/ ctx[25]._isRedSuit);
    			add_location(td3, file, 131, 20, 5135);
    			attr_dev(td4, "class", "svelte-1sqv3z7");
    			add_location(td4, file, 132, 20, 5251);
    			attr_dev(tr, "class", "svelte-1sqv3z7");
    			toggle_class(tr, "isCurrent", /*isCurrentRound*/ ctx[8](/*r*/ ctx[25].roundNumber));
    			toggle_class(tr, "isMiss", /*r*/ ctx[25].isMiss);
    			toggle_class(tr, "isBlind", /*r*/ ctx[25].isBlind);
    			add_location(tr, file, 126, 16, 4837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t10);
    			if_block.m(tr, null);
    			append_dev(tr, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2 && t0_value !== (t0_value = /*r*/ ctx[25].roundNumber + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*theGame*/ 2 && t2_value !== (t2_value = (/*r*/ ctx[25].isBlind ? "blind" : "") + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*theGame*/ 2 && t4_value !== (t4_value = (/*r*/ ctx[25].isMiss ? "miss" : "") + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*theGame*/ 2 && t6_value !== (t6_value = (/*r*/ ctx[25]._trumpSuit === "no"
    			? ""
    			: /*r*/ ctx[25]._trumpSuit) + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(td3, "redSuit", /*r*/ ctx[25]._isRedSuit);
    			}

    			if (dirty[0] & /*theGame*/ 2 && t8_value !== (t8_value = /*r*/ ctx[25].tricks + "")) set_data_dev(t8, t8_value);

    			if (dirty[0] & /*theGame, roundState, isCurrentRound*/ 274) {
    				each_value_3 = /*theGame*/ ctx[1]._players;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t10);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tr, t11);
    				}
    			}

    			if (dirty[0] & /*isCurrentRound, theGame*/ 258) {
    				toggle_class(tr, "isCurrent", /*isCurrentRound*/ ctx[8](/*r*/ ctx[25].roundNumber));
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(tr, "isMiss", /*r*/ ctx[25].isMiss);
    			}

    			if (dirty[0] & /*theGame*/ 2) {
    				toggle_class(tr, "isBlind", /*r*/ ctx[25].isBlind);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(126:12) {#each theGame._rounds as r}",
    		ctx
    	});

    	return block;
    }

    // (188:16) {#each theGame._players as p}
    function create_each_block_1(ctx) {
    	let td0;
    	let t0_value = /*p*/ ctx[20].getMadeBids() + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*p*/ ctx[20].getCurrentScore() + "";
    	let t2;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			attr_dev(td0, "colspan", "2");
    			attr_dev(td0, "class", "results totes svelte-1sqv3z7");
    			attr_dev(td0, "title", "bids made");
    			add_location(td0, file, 188, 20, 8584);
    			attr_dev(td1, "class", "totes svelte-1sqv3z7");
    			attr_dev(td1, "title", "score");
    			add_location(td1, file, 189, 20, 8683);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2 && t0_value !== (t0_value = /*p*/ ctx[20].getMadeBids() + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*theGame*/ 2 && t2_value !== (t2_value = /*p*/ ctx[20].getCurrentScore() + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(188:16) {#each theGame._players as p}",
    		ctx
    	});

    	return block;
    }

    // (197:4) {#if gameState === 3}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let tbody;
    	let each_value = /*theGame*/ ctx[1]._players;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Results!";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Made";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "Final Score";
    			t7 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file, 197, 8, 8898);
    			add_location(th0, file, 201, 16, 8985);
    			add_location(th1, file, 202, 16, 9015);
    			add_location(th2, file, 203, 16, 9045);
    			add_location(tr, file, 200, 12, 8964);
    			add_location(thead, file, 199, 12, 8944);
    			add_location(tbody, file, 206, 12, 9117);
    			attr_dev(table, "class", "svelte-1sqv3z7");
    			add_location(table, file, 198, 8, 8924);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(table, t7);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2) {
    				each_value = /*theGame*/ ctx[1]._players;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(197:4) {#if gameState === 3}",
    		ctx
    	});

    	return block;
    }

    // (208:12) {#each theGame._players as p}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*p*/ ctx[20].name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*p*/ ctx[20].getMadeBids() + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*p*/ ctx[20].getCurrentScore() + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(td0, "class", "svelte-1sqv3z7");
    			add_location(td0, file, 209, 20, 9208);
    			attr_dev(td1, "class", "totes results svelte-1sqv3z7");
    			attr_dev(td1, "title", "made bids (out of 18 possible)");
    			add_location(td1, file, 210, 20, 9246);
    			attr_dev(td2, "class", "totes svelte-1sqv3z7");
    			attr_dev(td2, "title", "final score");
    			add_location(td2, file, 211, 20, 9354);
    			add_location(tr, file, 208, 16, 9183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*theGame*/ 2 && t0_value !== (t0_value = /*p*/ ctx[20].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*theGame*/ 2 && t2_value !== (t2_value = /*p*/ ctx[20].getMadeBids() + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*theGame*/ 2 && t4_value !== (t4_value = /*p*/ ctx[20].getCurrentScore() + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(208:12) {#each theGame._players as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let if_block0 = /*gameState*/ ctx[3] === 0 && create_if_block_10(ctx);
    	let if_block1 = /*gameState*/ ctx[3] === 1 && create_if_block_9(ctx);
    	let if_block2 = /*gameState*/ ctx[3] === 2 && create_if_block_1(ctx);
    	let if_block3 = /*gameState*/ ctx[3] === 3 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Welcome to ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(h1, "class", "svelte-1sqv3z7");
    			add_location(h1, file, 90, 4, 3522);
    			attr_dev(main, "class", "svelte-1sqv3z7");
    			add_location(main, file, 89, 0, 3511);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t4);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t5);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t6);
    			if (if_block3) if_block3.m(main, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (/*gameState*/ ctx[3] === 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					if_block0.m(main, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*gameState*/ ctx[3] === 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_9(ctx);
    					if_block1.c();
    					if_block1.m(main, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*gameState*/ ctx[3] === 2) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(main, t6);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*gameState*/ ctx[3] === 3) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let theGame = new Game();
    	let numberOfPlayers;
    	let gameState = 0;
    	let roundState = 0;

    	let setNumberOfPlayers = numberOfPlayers => {
    		console.log("set number of players =" + numberOfPlayers);
    		theGame.setNumberOfPlayers(numberOfPlayers);
    		$$invalidate(3, gameState++, gameState);
    	};

    	let nameThisPlayer = (playerNum, playerName) => {
    		$$invalidate(1, theGame._players[playerNum].name = playerName, theGame);
    	};

    	let namingIsDone = () => {
    		console.log("naming done");
    		$$invalidate(3, gameState++, gameState);
    	};

    	let isCurrentRound = round => {
    		return theGame._currentRound == round;
    	};

    	let biddingIsDone = () => {
    		console.log("bidding done");
    		let totalBids = 0;
    		let dealerName = "";

    		for (let scoredPlayers = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
    			totalBids += theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound]._tricksNominated;
    			if (theGame._players[scoredPlayers]._isDealer) dealerName = theGame._players[scoredPlayers]._name;
    		}

    		console.log("totalBids=" + totalBids + " tricks=" + theGame._rounds[theGame._currentRound - 1].tricks);

    		if (totalBids === theGame._rounds[theGame._currentRound - 1].tricks) {
    			alert("The total bids can't equal the number of tricks - the Dealer [" + dealerName + "] needs to change their bid?");
    		} else {
    			$$invalidate(4, roundState++, roundState);
    		}
    	};

    	let trickingIsDone = () => {
    		console.log("tricking done");
    		let totalTricksWon = 0;
    		let totalTricksAvailable = 7;

    		for (let scoredPlayers = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
    			totalTricksWon += theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound]._tricksWon;
    		}

    		if (!theGame._rounds[theGame._currentRound - 1].isMiss) {
    			totalTricksAvailable = theGame._rounds[theGame._currentRound - 1].tricks;
    		}

    		console.log("totalTricksWon=" + totalTricksWon + " tricks=" + totalTricksAvailable);

    		if (totalTricksWon !== totalTricksAvailable) {
    			alert("The total tricks won [" + totalTricksWon + "] must equal the number of tricks available [" + totalTricksAvailable + "]- please update?");
    		} else {
    			for (let scoredPlayers = 0; scoredPlayers < theGame._numberOfPlayers; scoredPlayers++) {
    				let tempPRS = theGame._players[scoredPlayers]._playerRoundScores[theGame._currentRound];

    				if (theGame._rounds[theGame._currentRound - 1].isMiss) {
    					tempPRS._score = -3 * tempPRS._tricksWon;
    					tempPRS._madeBid = tempPRS._tricksWon === 0;
    				} else {
    					if (tempPRS._tricksWon === tempPRS._tricksNominated) {
    						tempPRS._madeBid = true;
    						tempPRS._score = 10 + tempPRS._tricksNominated;
    					} else {
    						tempPRS._score = tempPRS._tricksWon;
    					}
    				}

    				$$invalidate(1, theGame._players[scoredPlayers]._currentScore += tempPRS._score, theGame);
    				if (tempPRS._madeBid) $$invalidate(1, theGame._players[scoredPlayers]._madeBids += 1, theGame);
    			}

    			$$invalidate(1, theGame._currentRound++, theGame);
    			console.log("the next round is " + theGame._currentRound);

    			if (theGame._currentRound > 18) {
    				$$invalidate(3, gameState++, gameState);
    			} else {
    				theGame.moveDealerOn();
    				$$invalidate(4, roundState = 0);
    				if (theGame._rounds[theGame._currentRound - 1].isMiss) $$invalidate(4, roundState++, roundState);
    			}
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		numberOfPlayers = select_value(this);
    		$$invalidate(2, numberOfPlayers);
    	}

    	const change_handler = () => setNumberOfPlayers(numberOfPlayers);

    	function input_input_handler(each_value_7, index) {
    		each_value_7[index].name = this.value;
    		$$invalidate(1, theGame);
    	}

    	const change_handler_1 = (index, p) => nameThisPlayer(index, p.name);
    	const click_handler = () => namingIsDone();

    	function select_change_handler_1(r, each_value_3, p_index_2) {
    		each_value_3[p_index_2]._playerRoundScores[r.roundNumber]._tricksNominated = select_value(this);
    		$$invalidate(1, theGame);
    	}

    	function select_change_handler_2(r, each_value_3, p_index_2) {
    		each_value_3[p_index_2]._playerRoundScores[r.roundNumber]._tricksWon = select_value(this);
    		$$invalidate(1, theGame);
    	}

    	const click_handler_1 = () => biddingIsDone();
    	const click_handler_2 = () => trickingIsDone();

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Game,
    		name,
    		theGame,
    		numberOfPlayers,
    		gameState,
    		roundState,
    		setNumberOfPlayers,
    		nameThisPlayer,
    		namingIsDone,
    		isCurrentRound,
    		biddingIsDone,
    		trickingIsDone
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('theGame' in $$props) $$invalidate(1, theGame = $$props.theGame);
    		if ('numberOfPlayers' in $$props) $$invalidate(2, numberOfPlayers = $$props.numberOfPlayers);
    		if ('gameState' in $$props) $$invalidate(3, gameState = $$props.gameState);
    		if ('roundState' in $$props) $$invalidate(4, roundState = $$props.roundState);
    		if ('setNumberOfPlayers' in $$props) $$invalidate(5, setNumberOfPlayers = $$props.setNumberOfPlayers);
    		if ('nameThisPlayer' in $$props) $$invalidate(6, nameThisPlayer = $$props.nameThisPlayer);
    		if ('namingIsDone' in $$props) $$invalidate(7, namingIsDone = $$props.namingIsDone);
    		if ('isCurrentRound' in $$props) $$invalidate(8, isCurrentRound = $$props.isCurrentRound);
    		if ('biddingIsDone' in $$props) $$invalidate(9, biddingIsDone = $$props.biddingIsDone);
    		if ('trickingIsDone' in $$props) $$invalidate(10, trickingIsDone = $$props.trickingIsDone);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		theGame,
    		numberOfPlayers,
    		gameState,
    		roundState,
    		setNumberOfPlayers,
    		nameThisPlayer,
    		namingIsDone,
    		isCurrentRound,
    		biddingIsDone,
    		trickingIsDone,
    		select_change_handler,
    		change_handler,
    		input_input_handler,
    		change_handler_1,
    		click_handler,
    		select_change_handler_1,
    		select_change_handler_2,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'Nominate'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
