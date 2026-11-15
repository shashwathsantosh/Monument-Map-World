#!/usr/bin/env python3
"""Dual-stack (IPv4 + IPv6 localhost) static HTTP/1.1 server with HTTP 206 Byte-Range support for PMTiles."""

import argparse
import os
import re
import socket
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Connection", "close")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

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


class DualStackV6HTTPServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--directory", default="public")
    args = parser.parse_args()

    handler = lambda *h_args, **h_kwargs: RangeRequestHandler(*h_args, directory=args.directory, **h_kwargs)
    srv4 = ThreadingHTTPServer(("127.0.0.1", args.port), handler)

    servers = [srv4]
    try:
        srv6 = DualStackV6HTTPServer(("::1", args.port), handler)
        servers.append(srv6)
        t6 = threading.Thread(target=srv6.serve_forever, daemon=True)
        t6.start()
        print(
            f"Serving {args.directory} with HTTP/1.1 206 Byte-Range support on "
            f"http://localhost:{args.port} (IPv4 127.0.0.1 + IPv6 ::1)",
            flush=True,
        )
    except OSError as exc:
        print(
            f"Serving {args.directory} with HTTP/1.1 206 Byte-Range support on "
            f"http://127.0.0.1:{args.port} (IPv6 ::1 bind skipped: {exc})",
            flush=True,
        )

    srv4.serve_forever()


if __name__ == "__main__":
    main()
