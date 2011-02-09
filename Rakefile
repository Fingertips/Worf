task :default => :dist
task :dist    => [:build, :uglify]

require 'rubygems'

desc "Build distribution version"
task :build do
  begin
    require 'sprockets'
  rescue LoadError
    puts "[!] Please install the sprockets gem."
    exit
  end
  
  source_dir = File.expand_path('../src', __FILE__)
  secretary = Sprockets::Secretary.new(
    :root         =>  source_dir,
    :load_path    => [source_dir],
    :source_files => ['convert.js']
  )
  secretary.concatenation.save_to(File.expand_path('../dist/convert.js', __FILE__))
  
  source_dir = File.expand_path('../src/convert', __FILE__)
end

task :uglify do
  begin
    require 'uglifier'
  rescue LoadError
    puts "[!] Please install the uglifier gem."
    exit
  end
  
  dist_dir = File.expand_path('../dist', __FILE__)
  
  File.open(File.join(dist_dir, 'convert.min.js'), 'w') do |file|
    file.write(Uglifier.new.compile(File.read(File.join(dist_dir, 'convert.js'))))
  end
end