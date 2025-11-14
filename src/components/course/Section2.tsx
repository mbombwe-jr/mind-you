import './Notes.css';

interface Module {
  id: number;
  url: string;
  name: string;
  modname: string;
  description?: string;
}

interface SectionProps {
  id?: number;
  name: string;
  summary: string;
  modules?: Module[];
}

export default function Section2({ id, name, summary, modules }: SectionProps) {
  const getNoteType = (modname: string): string => {
    if (modname === 'resource' || modname === 'folder') return 'book';
    if (modname === 'forum' || modname === 'assign') return 'article';
    return 'picture';
  };

  return (
    <main className="notes-main">
      <div dangerouslySetInnerHTML={{ __html: summary }} />
      {modules && modules.length > 0 && (
        <div>
          {modules.map((module) => (
            <p key={module.id} style={{ marginBottom: '0.1em' }}>
              <a href={module.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none' }}>
                <span style={{ display: 'flex', justifyContent: 'flex-start', textDecoration: 'none' }}
                  className="link-main"
                  title={module.name}
                >
                  {module.name}
                </span>
                <span
                  role="complementary"
                  style={{ display: 'flex', justifyContent: 'flex-start', textDecoration: 'none' }}
                  className={`link-note ${getNoteType(module.modname)}`}
                  title={
                    module.description
                      ? typeof module.description === "string"
                        ? module.description.replace(/<[^>]+>/g, '')
                        : undefined
                      : `${module.modname} resource`
                  }
                >
                  {module.description ? (
                    <span
                      dangerouslySetInnerHTML={{ __html: module.description }}
                    />
                  ) : (
                    `${module.modname} resource`
                  )}
                </span>
              </a>
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
