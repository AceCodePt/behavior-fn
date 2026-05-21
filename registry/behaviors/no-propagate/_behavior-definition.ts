import { uniqueBehaviorDef } from "~utils";
import { schema } from './schema';

const definition = uniqueBehaviorDef({
  name: 'no-propagate',
  schema,
});

export default definition;
