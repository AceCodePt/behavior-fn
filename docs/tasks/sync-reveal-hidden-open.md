Currently the hidden an open aren't being used in the observed attributes.
The way we are doing it is with a mutation observer.
Fix the code and the testing in the reveal behavior in such a way
that will make the hidden and open sync (Or all attributes that being affected by reveal be in observed attributes).
Remove the useage of `await vi.runAllTimersAsync()` for stuff that belong to this syncing (If you could do aria attributes as well that will be awesome.

