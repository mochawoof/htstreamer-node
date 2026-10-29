# htstreamer
HtStreamer is a web screensharing service built in node.js with a focus on low latency. It uses raw websockets for maximum efficiency, as opposed to slower implementations using http or socket.io.

## Performance
Observed via in-app stats over a period of time, desktop under minimal load while moving/resizing windows
| Quality | Server Processing Time (ms) | FPS (/30) | Image Size (kb) |
| - | - | - | - |
| Potato | 30-80 | 27-29 | 5-6 |
| Low | 40-80 | 27-29 | 27-36 |
| Med | 58-80 | 26-29 | 71-81 |
| High | 59-80 | 25-29 | 187-203 |
| Lossless | 61-100 | 22-29 | 717-893 |

## Small Codebase
As of the time of this being written (at the first commit), the server code sits at 111 lines while the client code has 264.
