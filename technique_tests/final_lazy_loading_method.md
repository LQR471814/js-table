# After a while of agonizing here's the final lazy loading method

I am an idiot.

I just need remove a row from the top whenever I add a row to the bottom and do the opposite the other way

```text
Note: When removing an element, the browser will automatically scroll upwards to account for the missing space the element introduced.
No such behavior occurs when appending an element however it does update total scrollHeight.

So basically in the onscroll handler we need to ignore the auto browser scrolls when adding to the appendRowBuffer
```

The flow for lazy loading would then go something like this:

```text
User scrolls -> Add scroll offset to appendRowBuffer -> If appendRowBuffer is larger than the height of a row; postMessage to worker for row; update info

On recv row -> Add row height to appendRowBuffer (to counteract future browser auto scroll) -> Remove row -> Append recv'd row
```

**Alright, actually another final revision cause things changed when I actually started implementing this**

```text
Counteracting the auto scroll was right however immediately removing a row after appending one is a very bad idea.

It totally breaks scrolling and is just very messy in general and hard to get right

So instead it's better to just have a "clamp" of sorts, to make sure that every time more rows are added, doesn't overflow the "max" amount of rows.

In this case, that would be 1.2x the amount of rows that would fit on screen.

Once it exceeds this amount of rows, it will remove the amount of first rows (or last rows) that exceeds the limit

Ex.
12 rows but limit is 10
-2 rows from top / bottom
```

Actually, here's another revision

```text
I found out that mousewheel is a much better event to use since it still fires when you reach the top or bottom, it gives me pixel deltas automatically and I no longer need to use that weird hack to cancel out browser auto-scrolling.

So this is just an appendix to the original final revision
```
