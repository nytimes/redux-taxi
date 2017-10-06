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
                const actionSpy = jest.fn();
                const actionHandler = nextHandler(actionSpy);

                actionHandler(syncAction);
                expect(actionSpy).toHaveBeenCalledTimes(1);
                expect(actionSpy).toHaveBeenCalledWith(syncAction);
            });

            it('must throw an error if the action is not registered', () => {
                mockReduxTaxi.isRegistered = jest.fn(() => false);

                try {
                    nextHandler()(asyncAction);
                } catch (err) {
                    expect(err.message).toEqual(
                        expect.stringMatching(/ASYNC_TYPE/)
                    );
                }

                expect(mockReduxTaxi.isRegistered).toHaveBeenCalledTimes(1);
            });

            it('must collect promises for registered actions', () => {
                const promiseSpy = jest.fn();
                const actionSpy = jest.fn();
                mockReduxTaxi.isRegistered = jest.fn(() => true);
                mockReduxTaxi.collectPromise = promiseSpy;

                const actionHandler = nextHandler(actionSpy);

                actionHandler(asyncAction);

                expect(promiseSpy).toHaveBeenCalledTimes(1);
                expect(promiseSpy).toHaveBeenCalledWith(testPromise);

                expect(actionSpy).toHaveBeenCalledTimes(1);
                expect(actionSpy).toHaveBeenCalledWith(asyncAction);
            });
        }); // end describe('handle action')
    }); // end describe('handle next')
});
