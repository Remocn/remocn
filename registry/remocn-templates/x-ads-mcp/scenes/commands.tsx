import type { SceneProps } from "../content";
import { Command, Loading } from "../ui";

export const CampaignCommand = ({ scene, t }: SceneProps) => (
  <Command
    text={scene.content.command}
    t={t}
    start={1.85}
    finish={5.4}
    end={6.4}
    tracking
  />
);
export const Fetch = ({ scene, t }: SceneProps) => (
  <Loading text={scene.content.fetching} t={t} start={6.4} end={8.1} />
);
export const LaunchCommand = ({ scene, t }: SceneProps) => (
  <Command
    text={scene.content.launchCommand}
    t={t}
    start={10.3}
    finish={11.23}
    end={12.7}
  />
);
export const StatsLoading = ({ scene, t }: SceneProps) => (
  <Loading text={scene.content.statsLoading} t={t} start={25.6} end={27.8} />
);
export const ChangeCommand = ({ scene, t }: SceneProps) => (
  <Command
    text={scene.content.changeCommand}
    t={t}
    start={31}
    finish={32.24}
    end={32.85}
  />
);
export const DoubleCommand = ({ scene, t }: SceneProps) => (
  <Command
    text={scene.content.doubleCommand}
    t={t}
    start={37.35}
    finish={38.05}
    end={38.8}
    size={26}
  />
);
