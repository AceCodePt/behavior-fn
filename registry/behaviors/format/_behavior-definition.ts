import { uniqueBehaviorDef } from "~utils";
import { schema } from './schema';

const definition = uniqueBehaviorDef({
  name: 'format',
  schema,
});

export default definition;
