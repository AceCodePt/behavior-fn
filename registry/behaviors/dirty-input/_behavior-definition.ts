import { uniqueBehaviorDef } from '~utils';
import { schema } from './schema';

const definition = uniqueBehaviorDef({
  name: 'dirty',
  schema,
});

export default definition;
