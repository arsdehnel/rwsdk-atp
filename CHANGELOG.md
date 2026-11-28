## [1.0.2](https://github.com/arsdehnel/rwsdk-atp/compare/v1.0.1...v1.0.2) (2026-11-28)

### Bug Fixes

* adjust biome versions ([d75fc72](https://github.com/arsdehnel/rwsdk-atp/commit/d75fc72b814d1aee74464575fac8ac18c25f5ce8))
* vars streamlining and better patterns for deployed environments ([b205737](https://github.com/arsdehnel/rwsdk-atp/commit/b205737bc5be0fe566494d65bbb4dd7377660b22))

## [1.0.1](https://github.com/arsdehnel/rwsdk-atp/compare/v1.0.0...v1.0.1) (2026-11-28)

### Bug Fixes

* noop for new workflows ([2743398](https://github.com/arsdehnel/rwsdk-atp/commit/2743398cffb6fe5a8839ee65ec25e61aa54a60fc))

## 1.0.0 (2026-11-27)

### Features

* add app password mechanics to OAuth DO ([65dc656](https://github.com/arsdehnel/rwsdk-atp/commit/65dc6562052ab5f8f7163709952eb5421825f2c5))
* add errors and utils ([efb1b75](https://github.com/arsdehnel/rwsdk-atp/commit/efb1b7523a58ede74bc85e756c52ac8f4a1a8e6d))
* add initial DO logger ([a6b36a7](https://github.com/arsdehnel/rwsdk-atp/commit/a6b36a7cd39c532d0104c971fe7deedc65edd438))
* add initial oauth implementation ([eab3759](https://github.com/arsdehnel/rwsdk-atp/commit/eab3759773b395959bf47b3962411aab07a090ea))
* add internal crypto methods ([4880529](https://github.com/arsdehnel/rwsdk-atp/commit/48805294e104f35b14d219194b479abb77e02e79))
* add some error handler for the worker ([93943e5](https://github.com/arsdehnel/rwsdk-atp/commit/93943e5df9b40b3c30de12cfdddafa27f6d7d753))
* add tap webhook handling system ([3a564f1](https://github.com/arsdehnel/rwsdk-atp/commit/3a564f13193ff2ec7b74b89a8d987f43b9c8ef3c))
* better api response structures ([feb087d](https://github.com/arsdehnel/rwsdk-atp/commit/feb087d9468f0828c8b018871edb4c6245d3cb6b))
* clarify the error classes and their use cases ([793f5e6](https://github.com/arsdehnel/rwsdk-atp/commit/793f5e66e773c311e5b57cfc5b0679e644ec821c))
* included middleware and steperror ([e81a2a6](https://github.com/arsdehnel/rwsdk-atp/commit/e81a2a6e766f80d3dd1965cf0d82940408712e59))
* logger and browser sessions ([64e60cb](https://github.com/arsdehnel/rwsdk-atp/commit/64e60cb61f120eca43ab8120fb37dfe932dbd45c))
* move sessions to the env object argument pattern ([fb83971](https://github.com/arsdehnel/rwsdk-atp/commit/fb83971ba9e782f6c6032cf9139168eb9c9d0bb6))
* rename oauth to auth and add atp repo error ([7a4b8e8](https://github.com/arsdehnel/rwsdk-atp/commit/7a4b8e8006d71eb8140ab4115ded38029de477ed))
* response helpers first pass ([a852b32](https://github.com/arsdehnel/rwsdk-atp/commit/a852b32a01700f38ca4bbd229ba1fe2b63915b09))
* vite plugin for redirect rewrite ([428800e](https://github.com/arsdehnel/rwsdk-atp/commit/428800eaccb862cfdaf4f48d8838a568b42e18b8))

### Bug Fixes

* add did to the browser session type ([fc12406](https://github.com/arsdehnel/rwsdk-atp/commit/fc12406266e7b2e4be3e4e8c53724cac01f47953))
* add terraform to manage github settings ([267037d](https://github.com/arsdehnel/rwsdk-atp/commit/267037d299156e05c3ef7b105f570896713dc365))
* biome and knip fixes ([3d58d15](https://github.com/arsdehnel/rwsdk-atp/commit/3d58d15001d1088268eaf46d82517d57dd808ecf))
* browser sessions use newer DO methods ([cecffec](https://github.com/arsdehnel/rwsdk-atp/commit/cecffecf0559d996edda1e7ebe930d06d731ca74))
* correct the deployed environment callback and client_id ([e967004](https://github.com/arsdehnel/rwsdk-atp/commit/e9670044d2d708d25ff02e3b3803970f19378d1d))
* ensure did is set on new sessions ([d22d192](https://github.com/arsdehnel/rwsdk-atp/commit/d22d192a1f93ffbea570ed5edd40dc2e890393e6))
* export OAuthSession type ([48f88e2](https://github.com/arsdehnel/rwsdk-atp/commit/48f88e2fd6952e5ca2a3f2b9a0c3f32ec8257e8a))
* export the oauth client type ([cebf8a2](https://github.com/arsdehnel/rwsdk-atp/commit/cebf8a2b45a4e14ad09d791b49c4e3a3fac5201a))
* get caller info returns correct filename ([485bc1f](https://github.com/arsdehnel/rwsdk-atp/commit/485bc1f760d9006624b7b25e92316ba857918424))
* get ready for publishing to github registry ([d94b31b](https://github.com/arsdehnel/rwsdk-atp/commit/d94b31b2a6d9e8a86754864bd050e3f2c5f918be))
* more generic workflow logger factory ([2b4df8b](https://github.com/arsdehnel/rwsdk-atp/commit/2b4df8b508437cc6d086e29cbafa29d22c9909c1))
* remove packageManager field to prevent managed binary downloads in CI ([91b08e6](https://github.com/arsdehnel/rwsdk-atp/commit/91b08e6a134c9939435b15e8effe23a55a412b4e))
* remove single instance error ([4456c32](https://github.com/arsdehnel/rwsdk-atp/commit/4456c32972f22c4a8b720df0ee7a063ada73d25a))
* try another setup for distributed usage ([f820d92](https://github.com/arsdehnel/rwsdk-atp/commit/f820d92bf748b9428a773e1fdd48d484b6542bd8))
