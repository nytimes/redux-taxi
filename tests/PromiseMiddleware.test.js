import { spy } from 'sinon';
import PromiseMiddleware, { START, DONE } from '../src/PromiseMiddleware';

describe('PromiseMiddleware', () => {
  const nextHandler = PromiseMiddleware();

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
        const actionObj = {};
        const actionSpy = spy();
        const actionHandler = nextHandler(actionSpy);

        actionHandler(actionObj);

        expect(actionSpy.calledOnce).toBeTruthy();
        expect(actionSpy.firstCall.args[0]).toEqual(actionObj);
      });

      describe('handle promise action', () => {
        const promiseResolver = {};
        const promiseResolverFn = (resolve, reject) => {
          promiseResolver.resolve = resolve;
          promiseResolver.reject = reject;
        };

        const promiseAction = {
          type: 'test',
          promise: new Promise(promiseResolverFn),
        };

        it('must produce a START sequenced action', () => {
          const actionSpy = spy();
          const actionHandler = nextHandler(actionSpy);

          actionHandler(promiseAction);

          const { sequence, type } = actionSpy.firstCall.args[0];

          expect(actionSpy.calledOnce).toBeTruthy();
          expect(sequence).toBeDefined();
          expect(type).toEqual(promiseAction.type);
          expect(sequence.type).toEqual(START);
        });

        it('must produce a DONE sequenced action when the promise resolves', () => {
          const actionSpy = spy();
          const actionHandler = nextHandler(actionSpy);

          const promiseResult = actionHandler(promiseAction);

          const firstCallArgs = actionSpy.firstCall.args[0];
          const { sequence: { id: expectedId } } = firstCallArgs;

          expect(actionSpy.calledOnce).toBeTruthy();
          expect(firstCallArgs).toHaveProperty('type', promiseAction.type);
          expect(firstCallArgs).toHaveProperty('sequence');
          expect(firstCallArgs.sequence).toHaveProperty('type', START);

          promiseResolver.resolve();

          return promiseResult.then(() => {
            const secondCallArgs = actionSpy.secondCall.args[0];

            expect(actionSpy.calledTwice).toBeTruthy();
            expect(secondCallArgs.sequence).toHaveProperty('id', expectedId);
            expect(secondCallArgs.sequence).toHaveProperty('type', DONE);
          });
        });

        it('must produce an ERROR action when the promise rejects', () => {
          const actionSpy = spy();
          const actionHandler = nextHandler(actionSpy);

          const promiseResult = actionHandler(promiseAction);

          const firstCallArgs = actionSpy.firstCall.args[0];
          const { sequence: { id: expectedId } } = firstCallArgs;

          expect(actionSpy.calledOnce).toBeTruthy();
          expect(firstCallArgs).toHaveProperty('type', promiseAction.type);
          expect(firstCallArgs).toHaveProperty('sequence');
          expect(firstCallArgs.sequence).toHaveProperty('type', START);

          promiseResolver.reject();

          return promiseResult.catch(() => {
            const secondCallArgs = actionSpy.secondCall.args[0];

            expect(actionSpy.calledTwice).toBeTruthy();
            expect(secondCallArgs.sequence).toHaveProperty('id', expectedId);
            expect(secondCallArgs.error).toBeTruthy();
          });
        });

        it("must return a rejected promise when the action's promise rejects", () => {
          const originalError = 'reason of failure';
          const promiseActionToReject = {
            type: 'test',
            promise: Promise.reject(originalError),
          };
          const actionHandler = nextHandler(() => null);

          return actionHandler(promiseActionToReject)
            .then(() =>
              fail('expected promise to be rejected, but was resolved')
            )
            .catch(error => {
              expect(error).toEqual(originalError);
            });
        });
      }); // end describe('handle promise action')
    }); // end describe('handle action')
  }); // end describe('handle next')
});
