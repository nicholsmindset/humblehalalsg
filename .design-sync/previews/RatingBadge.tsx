import { RatingBadge } from "humblehalalsg";

export const Superb = () => <RatingBadge score={9.2} count={312} />;

export const VeryGood = () => <RatingBadge score={8.1} count={184} />;

export const Large = () => <RatingBadge score={8.8} count={96} lg />;

export const CustomWord = () => <RatingBadge score={9.5} word="Guest favourite" count={540} />;
