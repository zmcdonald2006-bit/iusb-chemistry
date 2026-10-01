# Regenerates sw.js: lists every file the app needs offline and stamps a version hash of
# their contents, so any change produces a new service worker (and an "update" prompt).
#
#   ruby tools/build-sw.rb           # rewrite sw.js
#   ruby tools/build-sw.rb --check   # exit 1 if sw.js is out of date (used by CI)
require 'digest'

ROOT = File.expand_path('..', __dir__)
Dir.chdir(ROOT)

files = ['index.html', 'manifest.webmanifest']
files += Dir.glob('css/**/*.css')
files += Dir.glob('js/**/*.js')
files += Dir.glob('content/**/*.js')
files += Dir.glob('assets/**/*.{svg,png,ico,webp}')
files = files.sort.uniq

digest = Digest::SHA256.new
files.each { |f| digest << f << "\0" << File.binread(f) }
version = digest.hexdigest[0, 12]

template = File.read('tools/sw.template.js')
list = files.map { |f| "  './#{f}'," }.join("\n")
out = template.sub('__CACHE_VERSION__', version).sub("  // __PRECACHE__\n", "  './',\n#{list}\n")

if ARGV.include?('--check')
  current = File.exist?('sw.js') ? File.read('sw.js') : ''
  if current != out
    warn 'sw.js is out of date. Run: ruby tools/build-sw.rb'
    exit 1
  end
  puts "sw.js is up to date (#{files.size} files, version #{version})"
else
  File.write('sw.js', out)
  puts "Wrote sw.js (#{files.size} files, version #{version})"
end
