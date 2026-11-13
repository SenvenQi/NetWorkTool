// Preserve submission order, while allowing later operations after a rejection.
export class AsyncQueue {
    private tail: Promise<void> = Promise.resolve();
    run<T>(operation: () => T | Promise<T>): Promise<T> {
        const result = this.tail.then(operation);
        this.tail = result.then(() => {}, () => {});
        return result;
    }
}
