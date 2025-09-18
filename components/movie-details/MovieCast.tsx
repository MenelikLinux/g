
interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

interface MovieCastProps {
  cast: Cast[];
  onActorClick: (actorId: number) => void;
}

export const MovieCast = ({ cast, onActorClick }: MovieCastProps) => {
  if (cast.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Cast</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {cast.map(actor => (
          <div 
            key={actor.id} 
            className="text-center group cursor-pointer"
            onClick={() => onActorClick(actor.id)}
          >
            <div className="overflow-hidden rounded-lg">
              <img
                src={actor.profile_path 
                  ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                  : '/placeholder.svg'
                }
                alt={actor.name}
                className="w-full aspect-[2/3] object-cover rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="font-medium text-sm">{actor.name}</p>
            <p className="text-xs text-muted-foreground">{actor.character}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
