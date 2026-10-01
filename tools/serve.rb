# Local preview server with caching disabled (uses only Ruby's standard library,
# which ships with macOS). Usage:  ruby tools/serve.rb [port]
require 'webrick'

root = File.expand_path('..', __dir__)
port = (ARGV[0] || 8080).to_i
server = WEBrick::HTTPServer.new(
  Port: port,
  DocumentRoot: root,
  AccessLog: [],
  MimeTypes: WEBrick::HTTPUtils::DefaultMimeTypes.merge('js' => 'text/javascript', 'webmanifest' => 'application/manifest+json', 'svg' => 'image/svg+xml')
)
server.config[:DirectoryIndex] = ['index.html']
class << server
  alias_method :orig_service, :service
  def service(req, res)
    orig_service(req, res)
    res['Cache-Control'] = 'no-store'
  end
end
trap('INT') { server.shutdown }
puts "Serving #{root} at http://localhost:#{port}"
server.start
