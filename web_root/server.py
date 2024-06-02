from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'x-requested-with, content-type')
        super().end_headers()

httpd = HTTPServer(('0.0.0.0', 8080), CORSRequestHandler)
print("Serving on port 8080")
httpd.serve_forever()
