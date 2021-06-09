## Input

`Headers` as an array of string

`Table Data` as an array of columns

`Window Dimensions` as an obj with X and Y

## Output

New `Rows` to be rendered

## Statemachine specification

| Events            | 0 - Initial | 1 - Processing |
|-------------------|:-----------:|:--------------:|
| onrequestrows     |    prc/1    |       que      |
| onsort            |    prc/1    |       que      |
| onsearch          |    prc/1    |       que      |
| onprocesscomplete |      -      |      ret/0     |

```text
ret = return process output to frontend
que = add action to queue
prc = process event
```

## Target Speed

Processing must be done in < 0.5s
