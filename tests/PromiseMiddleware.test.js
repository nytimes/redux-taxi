import {assert} from 'chai';
import PromiseMiddleware, {START, DONE} from '../src/PromiseMiddleware';

function assertPromiseRejects(promise, assertAgainst) {
    const matcher = typeof assertAgainst === 'function' ? assertAgainst : value => value === assertAgainst;
    return promise.then(
        () => assert(false, 'asserted promise expected to be rejected, but was resolved'),
        reason => matcher(reason)
    );
}

describe('PromiseMiddleware', () => {
    const nextHandler = PromiseMiddleware();

    it('must return a function to handle next', () => {
        assert.isFunction(nextHandler);
        assert.strictEqual(nextHandler.length, 1);
    });

    describe('handle next', () => {
        it('must return a function to handle action', () => {
            const actionHandler = nextHandler();

            assert.isFunction(actionHandler);
            assert.strictEqual(actionHandler.length, 1);
        });

        describe('handle action', () => {
            it('must pass actions without promises to the next handler', done => {
                const actionObj = {};
                const actionHandler = nextHandler(action => {
                    assert.strictEqual(action, actionObj);
                    done();
                });

                actionHandler(actionObj);
            });

            describe('handle promise action', () => {
                const promiseResolver = {};
                const promiseResolverFn = (resolve, reject) => {
                    promiseResolver.resolve = resolve;
                    promiseResolver.reject = reject;
                };

                const promiseAction = {
                    type: 'test',
                    promise: new Promise(promiseResolverFn)
                };

                it('must produce a START sequenced action', () => {
                    const actionHandler = nextHandler(action => {
                        assert.isDefined(action.sequence);
                        assert.strictEqual(action.type, promiseAction.type);
                        assert.strictEqual(action.sequence.type, START);
                    });

                    actionHandler(promiseAction);
                });

                it('must produce a DONE sequenced action when the promise resolves', () => {
                    let id;
                    const actionHandler = nextHandler(action => {
                        assert.isDefined(action.sequence);
                        assert.isDefined(action.sequence.type);
                        assert.strictEqual(action.type, promiseAction.type);

                        if (id) {
                            assert.strictEqual(action.sequence.id, id);
                            assert.strictEqual(action.sequence.type, DONE);
                        } else {
                            id = action.sequence.id; // store generated id for checking later
                            assert.strictEqual(action.sequence.type, START);
                        }
                    });

                    actionHandler(promiseAction);
                    promiseResolver.resolve();
                });

                it('must produce an ERROR action when the promise rejects', () => {
                    let id;
                    const actionHandler = nextHandler(action => {
                        assert.isDefined(action.sequence);
                        assert.isDefined(action.sequence.type);
                        assert.strictEqual(action.type, promiseAction.type);

                        if (id) {
                            assert.strictEqual(action.sequence.id, id);
                            assert.isTrue(action.error);
                        } else {
                            id = action.sequence.id; // store generated id for checking later
                            assert.strictEqual(action.sequence.type, START);
                        }
                    });

                    actionHandler(promiseAction);
                    promiseResolver.reject();
                });

                it('must return a rejected promise when the action\'s promise rejects', () => {
                    const originalError = 'reason';
                    const promiseActionToReject = {
                        type: 'test',
                        promise: Promise.reject(originalError)
                    };

                    const actionHandler = nextHandler(() => {});
                    const promise = actionHandler(promiseActionToReject);
                    return assertPromiseRejects(promise, error => {
                        assert.equal(error, originalError);
                    });
                });
            }); // end describe('handle promise action')
        }); // end describe('handle action')
    }); // end describe('handle next')
});
