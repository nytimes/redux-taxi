import sinon, { spy } from 'sinon';
import { ReduxTaxiMiddleware } from '../src/index';

describe('ReduxTaxiMiddleware', () => {
    const mockReduxTaxi = {
        isRegistered() {},
        collectPromise() {},
    };
    const nextHandler = ReduxTaxiMiddleware(mockReduxTaxi)();

    const SYNC_TYPE = 'SYNC_TYPE';
    const ASYNC_TYPE = 'ASYNC_TYPE';
    const testPromise = new Promise(() => {}, () => {});
    const syncAction = {
        type: SYNC_TYPE,
        payload: {},
    };
    const asyncAction = {
        type: ASYNC_TYPE,
        promise: testPromise,
    };

    it('must return a function to handle next', () => {
        expect(nextHandler).toBeInstanceOf(Function);
        expect(nextHandler).toHaveLength(1);
    });

    describe('handle next', () => {
        it('must return a function to handle action', () => {
            const actionHandler = nextHandler();

            expect(actionHandler).toBeInstanceOf(Function);
            expect(actionHandler).toHaveLength(1);
        });

        describe('handle action', () => {
            it('must pass actions without promises to the next handler', () => {
                const actionSpy = spy();
                const actionHandler = nextHandler(actionSpy);

                actionHandler(syncAction);
                expect(actionSpy.calledOnce).toBeTruthy();
                expect(actionSpy.firstCall.args[0]).toEqual(syncAction);
            });

            it('must throw an error if the action is not registered', () => {
                const isRegisteredStub = sinon.stub(
                    mockReduxTaxi,
                    'isRegistered',
                    () => false
                );

                try {
                    nextHandler()(asyncAction);
                } catch (err) {
                    expect(err.message).toEqual(
                        expect.stringMatching(/ASYNC_TYPE/)
                    );
                }

                expect(isRegisteredStub.calledOnce).toBeTruthy();
                mockReduxTaxi.isRegistered.restore();
            });

            it('must collect promises for registered actions', () => {
                const promiseSpy = spy();
                const actionSpy = spy();
                sinon.stub(mockReduxTaxi, 'isRegistered', () => true);
                sinon.stub(mockReduxTaxi, 'collectPromise', promiseSpy);

                const actionHandler = nextHandler(actionSpy);

                actionHandler(asyncAction);

                expect(promiseSpy.calledOnce).toBeTruthy();
                expect(promiseSpy.firstCall.args[0]).toEqual(testPromise);

                expect(actionSpy.calledOnce).toBeTruthy();
                expect(actionSpy.firstCall.args[0]).toEqual(asyncAction);

                mockReduxTaxi.isRegistered.restore();
                mockReduxTaxi.collectPromise.restore();
            });
        }); // end describe('handle action')
    }); // end describe('handle next')
});
