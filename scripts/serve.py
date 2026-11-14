#!/usr/bin/env python3
"""Static HTTP file server with HTTP/1.1 Byte-Range (206 Partial Content) support for PMTiles."""

import argparse
import os
import re
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        ctype = self.guess_type(path)
        if path.endswith(".pmtiles"):
            ctype = "application/vnd.pmtiles"
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        fs = os.fstat(f.fileno())
        size = fs.st_size
        range_hdr = self.headers.get("Range")
        if not range_hdr:
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f

        m = re.match(r"bytes=(\d+)-(\d*)", range_hdr.strip())
        if not m:
            f.close()
            self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Invalid Range header")
            return None
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1
        if start >= size or end < start:
            f.close()
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        end = min(end, size - 1)
        length = end - start + 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-type", ctype)
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        f.seek(start)
        self._range_remaining = length
        return f

    def copyfile(self, source, outputfile):
        rem = getattr(self, "_range_remaining", None)
        if rem is None:
            return super().copyfile(source, outputfile)
        bufsize = 64 * 1024
        while rem > 0:
            chunk = source.read(min(bufsize, rem))
            if not chunk:
                break
            outputfile.write(chunk)
            rem -= len(chunk)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--directory", default="public")
    args = parser.parse_args()

    handler = lambda *h_args, **h_kwargs: RangeRequestHandler(*h_args, directory=args.directory, **h_kwargs)
    srv = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"Serving {args.directory} with HTTP 206 Byte-Range support on http://127.0.0.1:{args.port}")
    srv.serve_forever()


if __name__ == "__main__":
    main()
