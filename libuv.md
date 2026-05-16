Assertion failed: !(handle->flags &         UV_HANDLE_CLOSING), file src\win\async.c, line 76     Assertion failed: !(handle->flags &                   UV_HANDLE_CLOSING), file src\win\async.c, line 76   
  Assertion failed: !(handle->flags &
  UV_HANDLE_CLOSING), file src\win\async.c, line 76   
  Assertion failed: !(handle->flags &
  UV_HANDLE_CLOSING), file src\win\async.c, line 76   

● This is a Windows-only libuv crash noise — not a bug   you need to fix.
     
  Here's what it means:

  - libuv is the async I/O engine underneath Node.js  
  - When a Node.js process dies abnormally (from an
  unhandled error like your BigInt crash or the       
  ByteString BOM crash), libuv has to abort
  mid-cleanup
  - On Windows, libuv has a strict internal assertion:
   !(handle->flags & UV_HANDLE_CLOSING) — it's        
  checking that you don't try to use an async handle  
  (socket, timer, file watcher) after it's already    
  been marked as "closing"
  - An abnormal crash violates that invariant, so     
  libuv prints this assertion and exits

  Why you see it multiple times: The Vercel dev server
   runs multiple worker threads. When one crashes, all
   of them hit the same libuv cleanup path and each   
  prints the assertion.

  What it signals: It always means something crashed  
  before that line. The real error is always the one  
  above it in the terminal — the BigInt error, the    
  ByteString/BOM error, etc.

  Once the root causes are fixed (BigInt serialization
   — done, BOM in token — done), you should stop      
  seeing it. It's libuv's way of saying "something    
  upstream killed me and I'm not happy about it" — not
   something you debug on its own.